/**
 * 관리자 집계 API
 * 
 * GET /api/admin/aggregates?session_code=<session_code>&admin_key=<admin_key>
 * 
 * 관리자/퍼실리테이터가 세션별 집계 데이터를 조회합니다.
 * - 유형 분포 (Type Distribution)
 * - 4축 평균/표준편차
 * - 우세 극성 비율
 * 
 * 보안:
 * - admin_key (환경 변수)로 접근 제어
 * - RPC 함수를 통해 집계만 반환 (개인 answers는 포함하지 않음)
 * 
 * 사용법:
 * GET /api/admin/aggregates?session_code=2024-01-15-morning&admin_key=your-admin-key
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

    // RPC 함수 호출 (통합 집계 데이터 조회)
    const { data, error } = await supabaseAdmin.rpc('get_session_aggregates', {
      p_session_code: sessionCode,
    });

    if (error) {
      console.error('집계 조회 실패:', error);
      
      // 세션이 존재하지 않는 경우
      if (error.message?.includes('Session not found')) {
        return NextResponse.json(
          {
            success: false,
            error: '세션을 찾을 수 없습니다',
            details: error.message,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: '집계 데이터 조회에 실패했습니다',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 추가 인사이트 계산 (디브리핑용)
    const insights = calculateInsights(data);

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        insights,
      },
    });
  } catch (error) {
    console.error('집계 API 에러:', error);
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
 * 디브리핑 인사이트 계산
 * 
 * 집계 데이터를 바탕으로 추가 인사이트를 계산합니다:
 * - 편차가 큰 축 TOP 2
 * - 한쪽으로 치우친 축 TOP 2
 */
function calculateInsights(aggregateData: any) {
  if (!aggregateData?.axisStats || !Array.isArray(aggregateData.axisStats)) {
    return {
      highVarianceAxes: [],
      skewedAxes: [],
    };
  }

  const axisStats = aggregateData.axisStats as Array<{
    axis: string;
    poleDistribution: Record<string, number>;
    meanScore: number;
    stddevScore: number;
  }>;

  // 편차가 큰 축 (표준편차 기준)
  const highVarianceAxes = [...axisStats]
    .sort((a, b) => (b.stddevScore || 0) - (a.stddevScore || 0))
    .slice(0, 2)
    .map((stat) => ({
      axis: stat.axis,
      stddev: stat.stddevScore,
    }));

  // 한쪽으로 치우친 축 (우세 극성 비율 기준, balanced 제외)
  const skewedAxes = axisStats
    .map((stat) => {
      const distribution = stat.poleDistribution || {};
      const balanced = distribution.balanced || 0;
      const maxPoleRatio = Math.max(
        ...Object.entries(distribution)
          .filter(([key]) => key !== 'balanced')
          .map(([, value]) => value as number)
      );

      // balanced 비율이 낮고 한쪽 극성이 높을수록 치우침
      const skewness = maxPoleRatio * (1 - balanced);

      return {
        axis: stat.axis,
        skewness,
        dominantPole: Object.entries(distribution)
          .filter(([key]) => key !== 'balanced')
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || null,
        poleRatio: maxPoleRatio,
      };
    })
    .sort((a, b) => b.skewness - a.skewness)
    .slice(0, 2)
    .map((item) => ({
      axis: item.axis,
      dominantPole: item.dominantPole,
      poleRatio: item.poleRatio,
    }));

  return {
    highVarianceAxes,
    skewedAxes,
  };
}

// POST 요청은 허용하지 않음
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET.' },
    { status: 405 }
  );
}

