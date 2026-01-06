/**
 * 리더십 진단 점수 계산 로직
 * 
 * 32문항의 응답(1~7점)을 입력받아 4개 축의 점수를 계산하고,
 * 각 축의 우세 극성을 판단하여 16가지 리더십 유형을 결정합니다.
 * 
 * 새로운 양극 선택형(Bipolar Forced-Choice) 방식:
 * - 각 문항은 서로 반대되는 두 리더십 방식을 제시
 * - 사용자가 1~7점 척도로 선택 (1: 좌측에 매우 가까움, 4: 균형적, 7: 우측에 매우 가까움)
 * - 선택 점수를 bipolar 값으로 변환: value = 선택 점수 - 4 (범위: -3 ~ +3)
 * - 각 축별 평균 bipolar 값을 계산하여 우세 극성 판단
 * 
 * 극성 판단:
 * - 평균 bipolar 값이 음수면 dimension1, 양수면 dimension2로 판단
 * - 미세한 차이도 인정하여 항상 한쪽 극성으로 판단 (균형 상태 없음)
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
    leftLabel: 'Intrinsic', // left_label이 dimension1에 해당
    rightLabel: 'Extrinsic', // right_label이 dimension2에 해당
  },
  Flexibility: {
    dimension1: 'Change',
    dimension2: 'System',
    code1: 'C',
    code2: 'S',
    dbKey: 'flexibility' as const,
    pole1Key: 'change' as const,
    pole2Key: 'system' as const,
    leftLabel: 'Change',
    rightLabel: 'System',
  },
  Direction: {
    dimension1: 'Results',
    dimension2: 'People',
    code1: 'R',
    code2: 'P',
    dbKey: 'direction' as const,
    pole1Key: 'results' as const,
    pole2Key: 'people' as const,
    leftLabel: 'Results',
    rightLabel: 'People',
  },
  Communication: {
    dimension1: 'Direct',
    dimension2: 'eNgage',
    code1: 'D',
    code2: 'N',
    dbKey: 'communication' as const,
    pole1Key: 'direct' as const,
    pole2Key: 'engage' as const,
    leftLabel: 'Direct',
    rightLabel: 'Engage',
  },
} as const;

/**
 * 선택 점수를 bipolar 값으로 변환
 * @param answer 선택한 점수 (1~7)
 * @returns bipolar 값 (-3 ~ +3)
 */
function toBipolarValue(answer: number): number {
  // 1점 → -3, 4점 → 0, 7점 → +3
  return answer - 4;
}

/**
 * 점수 계산 함수 (클라이언트/서버 공통)
 */
export function calculateScores(answers: Answers): Result {
  const axisScores: AxisScore[] = [];
  const codeParts: string[] = [];

  // 각 축별로 점수 계산
  for (const [axis, config] of Object.entries(AXIS_CONFIG)) {
    const axisQuestions = questions.filter((q) => q.axis === axis);
    
    let bipolarSum = 0; // bipolar 값의 합
    let answeredCount = 0; // 답변한 문항 수

    axisQuestions.forEach((question) => {
      const answer = answers[question.id];
      if (answer !== undefined && answer >= 1 && answer <= 7) {
        // 선택 점수를 bipolar 값으로 변환
        const bipolarValue = toBipolarValue(answer);
        
        // left_label이 dimension1에 해당하는지 확인
        // left_label이 dimension1이면: 음수 → dimension1, 양수 → dimension2
        // left_label이 dimension2이면: 음수 → dimension2, 양수 → dimension1
        // 현재 구조에서는 left_label이 항상 dimension1에 해당하므로
        // bipolar 값이 음수면 dimension1, 양수면 dimension2에 가까움
        bipolarSum += bipolarValue;
        answeredCount++;
      }
    });

    // 평균 bipolar 값 계산
    const avgBipolar = answeredCount > 0 ? bipolarSum / answeredCount : 0;

    // 평균 bipolar 값을 기반으로 dimension1과 dimension2의 점수 계산
    // avgBipolar가 -3 ~ 0이면 dimension1에 가까움, 0 ~ +3이면 dimension2에 가까움
    // 점수 표시를 위해 1~7 범위로 변환
    // dimension1 점수: avgBipolar가 -3이면 7, 0이면 4, +3이면 1
    // dimension2 점수: avgBipolar가 -3이면 1, 0이면 4, +3이면 7
    const score1 = Math.round((4 - avgBipolar) * 10) / 10; // dimension1 점수 (1~7 범위)
    const score2 = Math.round((4 + avgBipolar) * 10) / 10; // dimension2 점수 (1~7 범위)

    // 우세 극성 판단 (미세한 차이도 인정하여 항상 한쪽으로 판단)
    let dominant: string;
    let code: string;
    
    if (avgBipolar < 0) {
      // 음수면 dimension1 (left_label)에 가까움
      dominant = config.dimension1;
      code = config.code1;
    } else {
      // 0 이상이면 dimension2 (right_label)에 가까움 (0인 경우도 포함)
      dominant = config.dimension2;
      code = config.code2;
    }

    axisScores.push({
      axis,
      dimension1: config.dimension1,
      dimension2: config.dimension2,
      score1: Math.max(1, Math.min(7, score1)), // 1~7 범위로 제한
      score2: Math.max(1, Math.min(7, score2)), // 1~7 범위로 제한
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
