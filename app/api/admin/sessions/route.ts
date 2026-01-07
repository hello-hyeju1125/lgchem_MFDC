/**
 * 관리자 세션 관리 API
 * 
 * GET /api/admin/sessions?admin_key=...
 * - 세션 목록 조회 (최신순, 50개)
 * 
 * POST /api/admin/sessions?admin_key=...
 * body: { title, starts_at }
 * - 새 세션 생성
 * - session_code는 세션명(title)을 기반으로 생성
 * - 세션명의 공백은 하이픈(-)으로, 특수문자는 제거하여 URL-safe하게 변환
 * - 충돌 시 숫자 suffix 추가 (예: 세션명-1, 세션명-2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// 한국 시간대 설정 (Asia/Seoul)
const KOREA_TIMEZONE = 'Asia/Seoul';

// POST 요청 스키마
const CreateSessionSchema = z.object({
  title: z.string().min(1, '세션명은 필수입니다'),
  starts_at: z.string().datetime().optional(), // ISO 8601 형식
});

/**
 * 세션명을 URL-safe한 세션 코드로 변환
 * - 공백을 하이픈(-)으로 변환
 * - 특수문자는 제거하거나 하이픈으로 변환
 * - 연속된 하이픈은 하나로 통합
 * - 앞뒤 공백 및 하이픈 제거
 */
function sanitizeSessionCode(title: string): string {
  return title
    .trim()
    // 공백을 하이픈으로 변환
    .replace(/\s+/g, '-')
    // 특수문자를 하이픈으로 변환 (한글, 영문, 숫자, 하이픈, 언더스코어 제외)
    .replace(/[^가-힣a-zA-Z0-9\-_]/g, '-')
    // 연속된 하이픈을 하나로 통합
    .replace(/-+/g, '-')
    // 앞뒤 하이픈 제거
    .replace(/^-+|-+$/g, '')
    // 대문자로 변환 (선택사항, 필요시 주석 해제)
    // .toUpperCase();
}

/**
 * 세션 코드 충돌 체크 및 고유 코드 생성
 * 세션명을 기반으로 세션 코드를 생성하고, 충돌 시 suffix 추가
 */
async function generateUniqueSessionCode(title: string): Promise<string> {
  // 세션명을 세션 코드로 변환
  let code = sanitizeSessionCode(title);
  
  // 빈 문자열이면 기본값 사용
  if (!code) {
    code = 'SESSION';
  }
  
  let attempts = 0;
  const maxAttempts = 10;
  const baseCode = code;
  
  while (attempts < maxAttempts) {
    // 기존 세션 코드 확인
    const { data: existing } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('session_code', code)
      .maybeSingle();
    
    if (!existing) {
      // 사용 가능한 코드
      return code;
    }
    
    // 충돌 발생 시 숫자 suffix 추가
    attempts++;
    code = `${baseCode}-${attempts}`;
  }
  
  // 최후의 수단: 타임스탬프 기반
  const timestamp = Date.now().toString().slice(-6);
  return `${baseCode}-${timestamp}`;
}

/**
 * GET: 세션 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 관리자 키 검증
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('admin_key');
    
    const expectedAdminKey = process.env.ADMIN_KEY;
    if (!expectedAdminKey) {
      console.error('ADMIN_KEY 환경 변수가 설정되지 않았습니다');
      return NextResponse.json(
        {
          success: false,
          error: '서버 설정 오류',
        },
        { status: 500 }
      );
    }
    
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 관리자 키입니다',
        },
        { status: 401 }
      );
    }
    
    // 세션 목록 조회 (최신순, 50개)
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select('session_code, title, starts_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('세션 목록 조회 실패:', error);
      return NextResponse.json(
        {
          success: false,
          error: '세션 목록 조회에 실패했습니다',
          details: error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: sessions || [],
    });
  } catch (error) {
    console.error('세션 목록 API 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 새 세션 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 관리자 키 검증
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('admin_key');
    
    const expectedAdminKey = process.env.ADMIN_KEY;
    if (!expectedAdminKey) {
      console.error('ADMIN_KEY 환경 변수가 설정되지 않았습니다');
      return NextResponse.json(
        {
          success: false,
          error: '서버 설정 오류',
        },
        { status: 500 }
      );
    }
    
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 관리자 키입니다',
        },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = CreateSessionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '입력 데이터 검증 실패',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }
    
    const { title, starts_at } = validationResult.data;
    
    // 고유 세션 코드 생성 (세션명 기반)
    const sessionCode = await generateUniqueSessionCode(title);
    
    // starts_at을 한국 시간대 기준으로 처리
    let startsAtValue: string | null = null;
    if (starts_at) {
      // ISO 문자열을 그대로 저장 (Supabase가 TIMESTAMPTZ로 처리)
      startsAtValue = starts_at;
    }
    
    // 세션 생성
    const { data: newSession, error: insertError } = await supabaseAdmin
      .from('sessions')
      .insert({
        session_code: sessionCode,
        title,
        starts_at: startsAtValue,
      })
      .select('id, session_code, title, starts_at, created_at')
      .single();
    
    if (insertError) {
      console.error('세션 생성 실패:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: '세션 생성에 실패했습니다',
          details: insertError.message,
        },
        { status: 500 }
      );
    }
    
    // 참여 링크 생성 (현재 도메인 기준)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const participationLink = `${baseUrl}/test?session=${sessionCode}`;
    
    return NextResponse.json({
      success: true,
      data: {
        ...newSession,
        participationLink,
      },
    });
  } catch (error) {
    console.error('세션 생성 API 에러:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

