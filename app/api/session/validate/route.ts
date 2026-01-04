/**
 * 세션 코드 검증 API
 * 
 * GET /api/session/validate?session_code=...
 * 
 * 참가자가 입력한 세션 코드가 유효한지 확인합니다.
 * - 세션 존재 여부 확인
 * - 세션 정보 반환 (제목 등)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAnonymous } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionCode = searchParams.get('session_code');
    
    if (!sessionCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'session_code 파라미터가 필요합니다',
        },
        { status: 400 }
      );
    }
    
    // 세션 조회
    const { data: session, error } = await supabaseAnonymous
      .from('sessions')
      .select('id, session_code, title, starts_at')
      .eq('session_code', sessionCode)
      .maybeSingle();
    
    if (error) {
      console.error('세션 조회 에러:', error);
      return NextResponse.json(
        {
          success: false,
          error: '세션 조회 중 에러가 발생했습니다',
          details: error.message,
        },
        { status: 500 }
      );
    }
    
    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        title: session.title,
        starts_at: session.starts_at,
      },
    });
  } catch (error) {
    console.error('세션 검증 API 에러:', error);
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

