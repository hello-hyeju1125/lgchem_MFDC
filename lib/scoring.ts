/**
 * 리더십 진단 점수 계산 로직
 * 
 * 32문항의 응답(1~7점)을 입력받아 4개 축의 점수를 계산하고,
 * 각 축의 우세 극성을 판단하여 16가지 리더십 유형을 결정합니다.
 * 
 * 동점 처리:
 * - score1 === score2인 경우 "balanced"로 표시
 * - leadership_type 코드 생성 시 balanced가 있으면 'X'로 표시 (예: "IXRD", "ECXD")
 */

import type { Answers } from './storage';
import questions from '@/data/questions.json';

export interface AxisScore {
  axis: string;
  dimension1: string;
  dimension2: string;
  score1: number;
  score2: number;
  dominant: string; // 'dimension1', 'dimension2', 또는 'balanced'
}

export interface Result {
  code: string; // 16유형 코드 (예: "ICRD", "ECXD" 등, balanced는 'X'로 표시)
  scores: AxisScore[];
}

// DB 저장용 형식
export interface DatabaseAxisScores {
  motivation: { intrinsic: number; extrinsic: number };
  flexibility: { change: number; system: number };
  direction: { results: number; people: number };
  communication: { direct: number; engage: number };
}

export interface DatabasePole {
  motivation: 'intrinsic' | 'extrinsic' | 'balanced';
  flexibility: 'change' | 'system' | 'balanced';
  direction: 'results' | 'people' | 'balanced';
  communication: 'direct' | 'engage' | 'balanced';
}

const AXIS_CONFIG = {
  Motivation: {
    dimension1: 'Intrinsic',
    dimension2: 'Extrinsic',
    code1: 'I',
    code2: 'E',
    dbKey: 'motivation' as const,
    pole1Key: 'intrinsic' as const,
    pole2Key: 'extrinsic' as const,
  },
  Flexibility: {
    dimension1: 'Change',
    dimension2: 'System',
    code1: 'C',
    code2: 'S',
    dbKey: 'flexibility' as const,
    pole1Key: 'change' as const,
    pole2Key: 'system' as const,
  },
  Direction: {
    dimension1: 'Results',
    dimension2: 'People',
    code1: 'R',
    code2: 'P',
    dbKey: 'direction' as const,
    pole1Key: 'results' as const,
    pole2Key: 'people' as const,
  },
  Communication: {
    dimension1: 'Direct',
    dimension2: 'Engage',
    code1: 'D',
    code2: 'E',
    dbKey: 'communication' as const,
    pole1Key: 'direct' as const,
    pole2Key: 'engage' as const,
  },
} as const;

/**
 * 점수 계산 함수 (클라이언트/서버 공통)
 */
export function calculateScores(answers: Answers): Result {
  const axisScores: AxisScore[] = [];
  const codeParts: string[] = [];

  // 각 축별로 점수 계산
  for (const [axis, config] of Object.entries(AXIS_CONFIG)) {
    const axisQuestions = questions.filter((q) => q.axis === axis);
    
    let score1 = 0; // dimension1 점수
    let score2 = 0; // dimension2 점수

    axisQuestions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer >= 1 && answer <= 7) {
        if (question.dimension === config.dimension1) {
          // 해당 dimension 문항의 응답값을 그대로 더함
          score1 += answer;
          // 반대 dimension 점수는 (8 - 응답값)으로 계산
          score2 += 8 - answer;
        } else if (question.dimension === config.dimension2) {
          // 해당 dimension 문항의 응답값을 그대로 더함
          score2 += answer;
          // 반대 dimension 점수는 (8 - 응답값)으로 계산
          score1 += 8 - answer;
        }
      }
    });

    // 동점 처리: score1 === score2인 경우 "balanced"로 처리
    let dominant: string;
    let code: string;
    
    if (score1 === score2) {
      dominant = 'balanced';
      code = 'X'; // 동점인 경우 'X'로 표시
    } else if (score1 > score2) {
      dominant = config.dimension1;
      code = config.code1;
    } else {
      dominant = config.dimension2;
      code = config.code2;
    }

    axisScores.push({
      axis,
      dimension1: config.dimension1,
      dimension2: config.dimension2,
      score1,
      score2,
      dominant,
    });

    codeParts.push(code);
  }

  return {
    code: codeParts.join(''),
    scores: axisScores,
  };
}

/**
 * DB 저장용 형식으로 변환
 * 
 * @param result calculateScores로 계산된 결과
 * @returns DB에 저장할 형식 (axis_scores, pole)
 */
export function convertToDatabaseFormat(result: Result): {
  axisScores: DatabaseAxisScores;
  pole: DatabasePole;
} {
  const axisScores: DatabaseAxisScores = {
    motivation: { intrinsic: 0, extrinsic: 0 },
    flexibility: { change: 0, system: 0 },
    direction: { results: 0, people: 0 },
    communication: { direct: 0, engage: 0 },
  };

  const pole: DatabasePole = {
    motivation: 'balanced',
    flexibility: 'balanced',
    direction: 'balanced',
    communication: 'balanced',
  };

  // 각 축별로 변환
  result.scores.forEach((axisScore) => {
    const config = Object.values(AXIS_CONFIG).find(
      (c) => c.dimension1 === axisScore.dimension1 && c.dimension2 === axisScore.dimension2
    );

    if (!config) return;

    // 점수를 평균으로 변환 (1~7 범위로 정규화)
    const questionCount = 8; // 각 축당 8문항
    const avg1 = axisScore.score1 / questionCount;
    const avg2 = axisScore.score2 / questionCount;

    // 타입 안전하게 값 할당
    const dbKey = config.dbKey;
    const pole1Key = config.pole1Key;
    const pole2Key = config.pole2Key;

    if (dbKey === 'motivation') {
      axisScores.motivation[pole1Key as 'intrinsic' | 'extrinsic'] = Math.round(avg1 * 100) / 100;
      axisScores.motivation[pole2Key as 'intrinsic' | 'extrinsic'] = Math.round(avg2 * 100) / 100;
    } else if (dbKey === 'flexibility') {
      axisScores.flexibility[pole1Key as 'change' | 'system'] = Math.round(avg1 * 100) / 100;
      axisScores.flexibility[pole2Key as 'change' | 'system'] = Math.round(avg2 * 100) / 100;
    } else if (dbKey === 'direction') {
      axisScores.direction[pole1Key as 'results' | 'people'] = Math.round(avg1 * 100) / 100;
      axisScores.direction[pole2Key as 'results' | 'people'] = Math.round(avg2 * 100) / 100;
    } else if (dbKey === 'communication') {
      axisScores.communication[pole1Key as 'direct' | 'engage'] = Math.round(avg1 * 100) / 100;
      axisScores.communication[pole2Key as 'direct' | 'engage'] = Math.round(avg2 * 100) / 100;
    }

    // 우세 극성 변환 (대문자 → 소문자, 'balanced' 처리)
    if (axisScore.dominant === 'balanced') {
      pole[dbKey] = 'balanced';
    } else if (axisScore.dominant === config.dimension1) {
      pole[dbKey] = pole1Key as any;
    } else if (axisScore.dominant === config.dimension2) {
      pole[dbKey] = pole2Key as any;
    }
  });

  return { axisScores, pole };
}

