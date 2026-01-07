/**
 * 리더십 진단 점수 계산 로직
 * 
 * 64문항의 응답(1~7점)을 입력받아 4개 축의 점수를 계산하고,
 * 각 축의 우세 극성을 판단하여 16가지 리더십 유형을 결정합니다.
 * 
 * 새로운 7점 리커트 척도 방식:
 * - 각 문항은 독립적으로 1~7점으로 평가
 * - 각 축별로 dimension1과 dimension2 문항들을 분리하여 평균 계산
 * - 각 축별 평균 점수를 비교하여 우세 극성 판단
 * 
 * 극성 판단:
 * - dimension1 평균이 dimension2 평균보다 크면 dimension1, 작으면 dimension2로 판단
 * - 동일한 경우 dimension2로 판단 (기본값)
 */

import type { Answers } from './storage';
import questions from '@/data/questions.json';

export interface AxisScore {
  axis: string;
  dimension1: string;
  dimension2: string;
  score1: number;
  score2: number;
  dominant: string; // 'dimension1' 또는 'dimension2'
}

export interface Result {
  code: string; // 16유형 코드 (예: "ICRD", "ECPD" 등)
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
    code2: 'N',
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
    
    // dimension1과 dimension2 문항들을 분리
    const dimension1Questions = axisQuestions.filter((q) => q.dimension === config.dimension1);
    const dimension2Questions = axisQuestions.filter((q) => q.dimension === config.dimension2);
    
    // dimension1 평균 계산
    let dimension1Sum = 0;
    let dimension1Count = 0;
    dimension1Questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer >= 1 && answer <= 7) {
        dimension1Sum += answer;
        dimension1Count++;
      }
    });
    const dimension1Avg = dimension1Count > 0 ? dimension1Sum / dimension1Count : 0;
    
    // dimension2 평균 계산
    let dimension2Sum = 0;
    let dimension2Count = 0;
    dimension2Questions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer >= 1 && answer <= 7) {
        dimension2Sum += answer;
        dimension2Count++;
      }
    });
    const dimension2Avg = dimension2Count > 0 ? dimension2Sum / dimension2Count : 0;

    // 점수를 1~7 범위로 제한하고 반올림
    const score1 = Math.max(1, Math.min(7, Math.round(dimension1Avg * 10) / 10));
    const score2 = Math.max(1, Math.min(7, Math.round(dimension2Avg * 10) / 10));

    // 우세 극성 판단
    let dominant: string;
    let code: string;
    
    if (dimension1Avg > dimension2Avg) {
      // dimension1 평균이 더 높으면 dimension1에 가까움
      dominant = config.dimension1;
      code = config.code1;
    } else {
      // dimension2 평균이 더 높거나 같으면 dimension2에 가까움
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
    motivation: 'intrinsic', // 기본값 (실제로는 각 축의 dominant에 따라 덮어씌워짐)
    flexibility: 'change',
    direction: 'results',
    communication: 'direct',
  };

  // 각 축별로 변환
  result.scores.forEach((axisScore) => {
    const config = Object.values(AXIS_CONFIG).find(
      (c) => c.dimension1 === axisScore.dimension1 && c.dimension2 === axisScore.dimension2
    );

    if (!config) return;

    // 점수를 그대로 사용 (이미 1~7 범위로 정규화됨)
    const score1 = axisScore.score1;
    const score2 = axisScore.score2;

    // 타입 안전하게 값 할당
    const dbKey = config.dbKey;
    const pole1Key = config.pole1Key;
    const pole2Key = config.pole2Key;

    if (dbKey === 'motivation') {
      axisScores.motivation[pole1Key as 'intrinsic' | 'extrinsic'] = Math.round(score1 * 100) / 100;
      axisScores.motivation[pole2Key as 'intrinsic' | 'extrinsic'] = Math.round(score2 * 100) / 100;
    } else if (dbKey === 'flexibility') {
      axisScores.flexibility[pole1Key as 'change' | 'system'] = Math.round(score1 * 100) / 100;
      axisScores.flexibility[pole2Key as 'change' | 'system'] = Math.round(score2 * 100) / 100;
    } else if (dbKey === 'direction') {
      axisScores.direction[pole1Key as 'results' | 'people'] = Math.round(score1 * 100) / 100;
      axisScores.direction[pole2Key as 'results' | 'people'] = Math.round(score2 * 100) / 100;
    } else if (dbKey === 'communication') {
      axisScores.communication[pole1Key as 'direct' | 'engage'] = Math.round(score1 * 100) / 100;
      axisScores.communication[pole2Key as 'direct' | 'engage'] = Math.round(score2 * 100) / 100;
    }

    // 우세 극성 변환 (대문자 → 소문자)
    if (axisScore.dominant === config.dimension1) {
      pole[dbKey] = pole1Key as any;
    } else if (axisScore.dominant === config.dimension2) {
      pole[dbKey] = pole2Key as any;
    }
  });

  return { axisScores, pole };
}
