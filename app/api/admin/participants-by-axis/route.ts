/**
 * 관리자 축별 참여자 목록 API
 * 
 * GET /api/admin/participants-by-axis?session_code=<session_code>&admin_key=<admin_key>
 * 
 * 관리자/퍼실리테이터가 세션별 각 축(기준)의 각 극성별 참여자 목록을 조회합니다.
 * - 각 축(motivation, flexibility, direction, communication)의 각 극성별 참여자 목록 반환
 * 
 * 보안:
 * - admin_key (환경 변수)로 접근 제어
 * 
 * 사용법:
 * GET /api/admin/participants-by-axis?session_code=2024-01-15-morning&admin_key=your-admin-key
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

    // 응답 데이터 조회 (pole, axis_scores, participant 정보 포함)
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('responses')
      .select('pole, axis_scores, participant_name, participant_email')
      .eq('session_id', session.id);

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

    // 각 축별로 극성별 그룹화
    const axes = ['motivation', 'flexibility', 'direction', 'communication'] as const;
    const result: Record<
      string,
      Record<
        string,
        Array<{ name: string | null; email: string | null; score: number }>
      >
    > = {};

    // 초기화
    axes.forEach((axis) => {
      result[axis] = {};
    });

    // 응답 데이터를 축별/극성별로 그룹화
    responses?.forEach((response) => {
      const pole = response.pole as Record<string, string>;
      const axisScores = response.axis_scores as Record<string, Record<string, number>>;
      const participant = {
        name: response.participant_name || null,
        email: response.participant_email || null,
      };

      axes.forEach((axis) => {
        const poleValue = pole[axis];
        if (poleValue && poleValue !== 'balanced') {
          if (!result[axis][poleValue]) {
            result[axis][poleValue] = [];
          }
          // 해당 축의 해당 극성 점수 가져오기
          const score = axisScores[axis]?.[poleValue] || 0;
          result[axis][poleValue].push({
            ...participant,
            score,
          });
        }
      });
    });

    // 배열 형태로 변환 (점수 기준 내림차순 정렬)
    const participantsByAxis = axes.map((axis) => ({
      axis,
      poles: Object.entries(result[axis]).map(([pole, participants]) => ({
        pole,
        participants: participants.sort((a, b) => (b.score || 0) - (a.score || 0)), // 점수 높은 순으로 정렬
        count: participants.length,
      })),
    }));

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: participantsByAxis,
    });
  } catch (error) {
    console.error('축별 참여자 목록 API 에러:', error);
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

