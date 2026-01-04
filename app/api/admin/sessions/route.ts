/**
 * 관리자 세션 관리 API
 * 
 * GET /api/admin/sessions?admin_key=...
 * - 세션 목록 조회 (최신순, 50개)
 * 
 * POST /api/admin/sessions?admin_key=...
 * body: { title, starts_at }
 * - 새 세션 생성
 * - session_code는 LGCH-YYYYMMDD-AM/PM 형태로 자동 생성
 * - 충돌 시 난수 suffix 추가
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
 * session_code 자동 생성
 * 형식: LGCH-YYYYMMDD-AM 또는 LGCH-YYYYMMDD-PM
 * 충돌 시: LGCH-YYYYMMDD-AM-RANDOM 형태로 난수 suffix 추가
 */
function generateSessionCode(startsAt?: string): string {
  let date: Date;
  
  if (startsAt) {
    // starts_at이 제공된 경우 (ISO 8601 형식)
    // ISO 문자열을 파싱하고 한국 시간대로 변환
    date = new Date(startsAt);
    
    // ISO 문자열의 경우 UTC 기준이므로, 한국 시간(UTC+9)으로 변환
    // 한국 시간대의 날짜/시간 가져오기
    const koreaTimeString = date.toLocaleString('en-US', { 
      timeZone: KOREA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // "MM/DD/YYYY, HH:mm" 형식을 파싱
    const [datePart, timePart] = koreaTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  } else {
    // 현재 시간 기준 (한국 시간)
    const now = new Date();
    const koreaTimeString = now.toLocaleString('en-US', { 
      timeZone: KOREA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const [datePart, timePart] = koreaTimeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    
    date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  
  // 오전(AM): 0-11시, 오후(PM): 12-23시
  const period = hours < 12 ? 'AM' : 'PM';
  
  const baseCode = `LGCH-${year}${month}${day}-${period}`;
  return baseCode;
}

/**
 * 세션 코드 충돌 체크 및 고유 코드 생성
 */
async function generateUniqueSessionCode(startsAt?: string): Promise<string> {
  let code = generateSessionCode(startsAt);
  let attempts = 0;
  const maxAttempts = 10;
  
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
    
    // 충돌 발생 시 난수 suffix 추가
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    code = `${code}-${randomSuffix}`;
    attempts++;
  }
  
  // 최후의 수단: 타임스탬프 기반
  const timestamp = Date.now().toString().slice(-6);
  return `${generateSessionCode(startsAt)}-${timestamp}`;
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
    
    // 고유 세션 코드 생성
    const sessionCode = await generateUniqueSessionCode(starts_at);
    
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

