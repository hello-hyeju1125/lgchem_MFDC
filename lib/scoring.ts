/**
 * 리더십 진단 점수 계산 로직
 * 
 * 새로운 Set 기반 계산 방식:
 * - 문항은 2개가 1 Set으로 구성 (총 32개 문항 = 16 Set)
 * - Set 내 두 문항은 서로 대립되는 성향
 * - Set 단위로 평균 계산 → 동일 성향 문항들을 묶어 평균 → 축 기준 정규화
 * 
 * 점수 계산 규칙:
 * 1. Set 단위로 평균 계산
 * 2. 동일 성향 문항들을 묶어 평균 점수 계산
 * 3. 각 축(pair)에서 두 성향의 평균 점수 합은 반드시 100이 되어야 함
 *    - 변화 평균지수 + 관리 평균지수 = 100
 *    - 사람 평균지수 + 일 평균지수 = 100
 *    - 내재적 평균지수 + 외재적 평균지수 = 100
 *    - 지시 평균지수 + 참여 평균지수 = 100
 * 
 * 최종 점수:
 * - 내재적/외재적, 사람/일, 변화/관리, 지시/참여 (각 축별로 합이 100)
 */

import type { Answers } from './storage';
import questions from '@/data/questions.json';

export interface AxisScore {
  axis: string;
  dimension1: string;
  dimension2: string;
  score1: number; // dimension1의 정규화된 점수 (0-100)
  score2: number; // dimension2의 정규화된 점수 (0-100)
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
  direction: { work: number; people: number };
  communication: { direct: number; engage: number };
}

export interface DatabasePole {
  motivation: 'intrinsic' | 'extrinsic' | 'balanced';
  flexibility: 'change' | 'system' | 'balanced';
  direction: 'work' | 'people' | 'balanced';
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
    dimension1: 'Work',
    dimension2: 'People',
    code1: 'R',
    code2: 'P',
    dbKey: 'direction' as const,
    pole1Key: 'work' as const,
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
 * 
 * 계산 과정:
 * 1. 각 Set에서 두 문항의 점수를 평균 계산
 * 2. 동일 성향의 Set 평균들을 모아서 전체 평균 계산
 * 3. 각 축에서 두 성향의 평균 합이 100이 되도록 정규화
 */
export function calculateScores(answers: Answers): Result {
  const axisScores: AxisScore[] = [];
  const codeParts: string[] = [];

  // 각 축별로 점수 계산
  for (const [axis, config] of Object.entries(AXIS_CONFIG)) {
    // 해당 축의 모든 Set 찾기
    const axisSets = questions.filter((set) => set.axis === axis);
    
    // dimension1과 dimension2의 Set 평균들을 저장할 배열
    const dimension1SetAverages: number[] = [];
    const dimension2SetAverages: number[] = [];
    
    // 각 Set에 대해 처리
    for (const set of axisSets) {
      let dimension1Sum = 0;
      let dimension1Count = 0;
      let dimension2Sum = 0;
      let dimension2Count = 0;
      
      // Set 내 두 문항 처리
      for (const question of set.questions) {
        const answer = answers[question.id];
        if (answer !== undefined && answer >= 1 && answer <= 7) {
          if (question.dimension === config.dimension1) {
            dimension1Sum += answer;
            dimension1Count++;
          } else if (question.dimension === config.dimension2) {
            dimension2Sum += answer;
            dimension2Count++;
          }
        }
      }
      
      // Set 단위 평균 계산 (각 Set에서 dimension1과 dimension2의 평균)
      if (dimension1Count > 0) {
        dimension1SetAverages.push(dimension1Sum / dimension1Count);
      }
      if (dimension2Count > 0) {
        dimension2SetAverages.push(dimension2Sum / dimension2Count);
      }
    }
    
    // 동일 성향 문항들을 묶어 평균 점수 계산
    const dimension1Avg = dimension1SetAverages.length > 0
      ? dimension1SetAverages.reduce((sum, avg) => sum + avg, 0) / dimension1SetAverages.length
      : 0;
    
    const dimension2Avg = dimension2SetAverages.length > 0
      ? dimension2SetAverages.reduce((sum, avg) => sum + avg, 0) / dimension2SetAverages.length
      : 0;
    
    // 축별 평균값을 100 기준으로 정규화 (두 성향의 합 = 100)
    let score1: number;
    let score2: number;
    
    const total = dimension1Avg + dimension2Avg;
    if (total > 0) {
      // 비율로 정규화하여 합이 100이 되도록
      score1 = (dimension1Avg / total) * 100;
      score2 = (dimension2Avg / total) * 100;
    } else {
      // 둘 다 0인 경우 기본값 50:50
      score1 = 50;
      score2 = 50;
    }
    
    // 소수점 둘째 자리까지 반올림
    score1 = Math.round(score1 * 100) / 100;
    score2 = Math.round(score2 * 100) / 100;
    
    // 합이 정확히 100이 되도록 조정 (반올림 오차 보정)
    const sum = score1 + score2;
    if (Math.abs(sum - 100) > 0.01) {
      const diff = 100 - sum;
      score1 += diff;
      score1 = Math.round(score1 * 100) / 100;
      score2 = 100 - score1;
    }

    // 우세 극성 판단
    let dominant: string;
    let code: string;
    
    if (score1 > score2) {
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
    direction: { work: 0, people: 0 },
    communication: { direct: 0, engage: 0 },
  };

  const pole: DatabasePole = {
    motivation: 'intrinsic',
    flexibility: 'change',
    direction: 'work',
    communication: 'direct',
  };

  // 각 축별로 변환
  result.scores.forEach((axisScore) => {
    const config = Object.values(AXIS_CONFIG).find(
      (c) => c.dimension1 === axisScore.dimension1 && c.dimension2 === axisScore.dimension2
    );

    if (!config) return;

    // 정규화된 점수 사용 (이미 0-100 범위)
    const score1 = axisScore.score1;
    const score2 = axisScore.score2;

    // 타입 안전하게 값 할당
    const dbKey = config.dbKey;
    const pole1Key = config.pole1Key;
    const pole2Key = config.pole2Key;

    if (dbKey === 'motivation') {
      axisScores.motivation[pole1Key as 'intrinsic' | 'extrinsic'] = score1;
      axisScores.motivation[pole2Key as 'intrinsic' | 'extrinsic'] = score2;
    } else if (dbKey === 'flexibility') {
      axisScores.flexibility[pole1Key as 'change' | 'system'] = score1;
      axisScores.flexibility[pole2Key as 'change' | 'system'] = score2;
    } else if (dbKey === 'direction') {
      axisScores.direction[pole1Key as 'work' | 'people'] = score1;
      axisScores.direction[pole2Key as 'work' | 'people'] = score2;
    } else if (dbKey === 'communication') {
      axisScores.communication[pole1Key as 'direct' | 'engage'] = score1;
      axisScores.communication[pole2Key as 'direct' | 'engage'] = score2;
    }

    // 우세 극성 변환
    if (axisScore.dominant === config.dimension1) {
      pole[dbKey] = pole1Key as any;
    } else if (axisScore.dominant === config.dimension2) {
      pole[dbKey] = pole2Key as any;
    }
  });

  return { axisScores, pole };
}
