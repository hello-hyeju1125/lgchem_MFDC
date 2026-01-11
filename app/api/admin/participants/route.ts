/**
 * 관리자 참여자 목록 API
 * 
 * GET /api/admin/participants?session_code=<session_code>&admin_key=<admin_key>
 * 
 * 관리자/퍼실리테이터가 세션별 리더십 유형별 참여자 목록을 조회합니다.
 * - 각 리더십 유형별로 속하는 참여자들의 이름과 이메일 반환
 * 
 * 보안:
 * - admin_key (환경 변수)로 접근 제어
 * 
 * 사용법:
 * GET /api/admin/participants?session_code=2024-01-15-morning&admin_key=your-admin-key
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const sessionCode = searchParams.get('session_code');
    const adminKey = searchParams.get('admin_key');

    // 필수 파라미터 검증
    if (!sessionCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'session_code 파라미터가 필요합니다',
        },
        { status: 400 }
      );
    }

    // 관리자 키 검증
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

    // 세션 ID 조회
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('session_code', sessionCode)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: '세션을 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    // 리더십 유형별 참여자 목록 조회
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('responses')
      .select('leadership_type, participant_name, participant_email')
      .eq('session_id', session.id)
      .order('leadership_type', { ascending: true })
      .order('participant_name', { ascending: true, nullsFirst: false });

    if (responsesError) {
      console.error('참여자 목록 조회 실패:', responsesError);
      return NextResponse.json(
        {
          success: false,
          error: '참여자 목록 조회에 실패했습니다',
          details: responsesError.message,
        },
        { status: 500 }
      );
    }

    // 리더십 유형별로 그룹화
    const groupedByType: Record<
      string,
      Array<{ name: string | null; email: string | null }>
    > = {};

    responses?.forEach((response) => {
      const type = response.leadership_type;
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push({
        name: response.participant_name || null,
        email: response.participant_email || null,
      });
    });

    // 배열 형태로 변환
    const participantsByType = Object.entries(groupedByType).map(
      ([type, participants]) => ({
        type,
        participants,
        count: participants.length,
      })
    );

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: participantsByType,
    });
  } catch (error) {
    console.error('참여자 목록 API 에러:', error);
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

// POST 요청은 허용하지 않음
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET.' },
    { status: 405 }
  );
}

