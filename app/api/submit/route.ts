/**
 * 진단 제출 API
 * 
 * POST /api/submit
 * 
 * 익명 사용자가 진단 결과를 제출합니다.
 * - session_code와 32문항의 응답(answers)을 받습니다
 * - 점수를 계산하고 responses 테이블에 저장합니다
 * - 개인 결과 요약을 반환합니다 (개인 화면용)
 * 
 * 보안:
 * - RLS 정책에 따라 anonymous 사용자는 INSERT만 가능
 * - answers 원본은 저장하되, 반환값에는 포함하지 않음
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAnonymous } from '@/lib/supabaseAdmin';
import { calculateScores, convertToDatabaseFormat } from '@/lib/scoring';
import type { Answers } from '@/lib/storage';

// 입력 검증 스키마
const SubmitSchema = z.object({
  sessionCode: z.string().min(1, '세션 코드는 필수입니다'),
  answers: z
    .record(z.string(), z.number().int().min(1).max(7))
    .refine(
      (answers) => Object.keys(answers).length === 32,
      '32문항에 대한 응답이 모두 필요합니다'
    ),
  clientHash: z.string().optional(), // 중복 제출 방지용 (선택사항)
});

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();

    // 입력 검증
    const validationResult = SubmitSchema.safeParse(body);
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

    const { sessionCode, answers, clientHash } = validationResult.data;

    // session_code로 session_id 조회
    const { data: session, error: sessionError } = await supabaseAnonymous
      .from('sessions')
      .select('id, session_code')
      .eq('session_code', sessionCode)
      .maybeSingle(); // single() 대신 maybeSingle() 사용 (결과가 없어도 에러가 나지 않음)

    if (sessionError) {
      console.error('세션 조회 에러:', sessionError);
      return NextResponse.json(
        {
          success: false,
          error: '세션 조회 중 에러가 발생했습니다',
          details: sessionError.message,
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 세션 코드입니다',
          details: `세션 코드 "${sessionCode}"를 찾을 수 없습니다. Supabase에서 세션이 생성되었는지 확인하세요.`,
        },
        { status: 404 }
      );
    }

    // 점수 계산
    const result = calculateScores(answers as Answers);

    // DB 저장용 형식으로 변환
    const { axisScores, pole } = convertToDatabaseFormat(result);

    // responses 테이블에 저장 (반환값 없이 INSERT만 수행)
    // SELECT 권한이 필요없도록 .select()를 제거하여 RLS 정책 충돌 방지
    const { error: insertError } = await supabaseAnonymous
      .from('responses')
      .insert({
        session_id: session.id,
        leadership_type: result.code,
        axis_scores: axisScores,
        pole: pole,
        answers: answers, // 원본 데이터 (검증/디버깅용, 관리자 화면에 노출하지 않음)
        client_hash: clientHash || null,
      });

    if (insertError) {
      console.error('응답 저장 실패:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: '응답 저장에 실패했습니다',
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    // 성공 응답 (개인 화면용 - answers는 포함하지 않음)
    // INSERT는 성공했지만 반환값은 요청하지 않았으므로 현재 시각을 사용
    return NextResponse.json({
      success: true,
      data: {
        leadershipType: result.code,
        scores: result.scores.map((score) => ({
          axis: score.axis,
          dimension1: score.dimension1,
          dimension2: score.dimension2,
          score1: Math.round((score.score1 / 8) * 100) / 100, // 평균으로 변환
          score2: Math.round((score.score2 / 8) * 100) / 100,
          dominant: score.dominant,
        })),
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('제출 API 에러:', error);
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

// GET 요청은 허용하지 않음
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

