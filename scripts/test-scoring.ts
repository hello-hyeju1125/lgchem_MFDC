/**
 * 점수 계산 로직 테스트 스크립트
 * 
 * 이 스크립트는 scoring.ts의 점수 계산 로직을 검증합니다.
 * - 일반 케이스 테스트
 * - 동점(tie) 케이스 테스트
 * - 엣지 케이스 테스트
 * 
 * 실행 방법:
 * npx tsx scripts/test-scoring.ts
 * 또는
 * npm run test:scoring (package.json에 스크립트 추가 후)
 */

import { calculateScores, convertToDatabaseFormat } from '../lib/scoring';
import type { Answers } from '../lib/storage';

// 테스트 케이스 정의
const testCases = [
  {
    name: '일반 케이스: ICRD 유형',
    answers: {
      // Motivation: 모두 높은 점수 (Intrinsic 우세)
      M1: 7, M2: 6, M3: 7, M4: 6, M5: 7, M6: 6, M7: 7, M8: 6,
      // Flexibility: 모두 높은 점수 (Change 우세)
      F9: 6, F10: 7, F11: 6, F12: 7, F13: 6, F14: 7, F15: 6, F16: 7,
      // Direction: 모두 높은 점수 (Results 우세)
      D17: 7, D18: 6, D19: 7, D20: 6, D21: 7, D22: 6, D23: 7, D24: 6,
      // Communication: 모두 높은 점수 (Direct 우세)
      C25: 6, C26: 7, C27: 6, C28: 7, C29: 6, C30: 7, C31: 6, C32: 7,
    } as Answers,
    expectedCode: 'ICRD',
  },
  {
    name: '동점 케이스: 한 축이 동점',
    answers: {
      // Motivation: 동점 만들기 (각 4점씩, 총합 32점)
      M1: 4, M2: 4, M3: 4, M4: 4, M5: 4, M6: 4, M7: 4, M8: 4,
      // Flexibility: Change 우세
      F9: 6, F10: 6, F11: 6, F12: 6, F13: 6, F14: 6, F15: 6, F16: 6,
      // Direction: Results 우세
      D17: 6, D18: 6, D19: 6, D20: 6, D21: 6, D22: 6, D23: 6, D24: 6,
      // Communication: Direct 우세
      C25: 6, C26: 6, C27: 6, C28: 6, C29: 6, C30: 6, C31: 6, C32: 6,
    } as Answers,
    expectedCode: 'XCRD', // Motivation이 동점이므로 'X'
  },
  {
    name: '반대 극성 케이스: ESPN 유형',
    answers: {
      // Motivation: 낮은 점수 (Extrinsic, 역채점으로 인해)
      M1: 1, M2: 2, M3: 1, M4: 2, M5: 1, M6: 2, M7: 1, M8: 2,
      // Flexibility: 낮은 점수 (System, 역채점으로 인해)
      F9: 2, F10: 1, F11: 2, F12: 1, F13: 2, F14: 1, F15: 2, F16: 1,
      // Direction: 낮은 점수 (People, 역채점으로 인해)
      D17: 1, D18: 2, D19: 1, D20: 2, D21: 1, D22: 2, D23: 1, D24: 2,
      // Communication: 낮은 점수 (eNgage, 역채점으로 인해)
      C25: 2, C26: 1, C27: 2, C28: 1, C29: 2, C30: 1, C31: 2, C32: 1,
    } as Answers,
    expectedCode: 'ESPN',
  },
  {
    name: '엣지 케이스: 최소값 (모두 1점)',
    answers: {
      M1: 1, M2: 1, M3: 1, M4: 1, M5: 1, M6: 1, M7: 1, M8: 1,
      F9: 1, F10: 1, F11: 1, F12: 1, F13: 1, F14: 1, F15: 1, F16: 1,
      D17: 1, D18: 1, D19: 1, D20: 1, D21: 1, D22: 1, D23: 1, D24: 1,
      C25: 1, C26: 1, C27: 1, C28: 1, C29: 1, C30: 1, C31: 1, C32: 1,
    } as Answers,
    expectedCode: 'ESPN', // 역채점으로 인해 반대 극성
  },
  {
    name: '엣지 케이스: 최대값 (모두 7점)',
    answers: {
      M1: 7, M2: 7, M3: 7, M4: 7, M5: 7, M6: 7, M7: 7, M8: 7,
      F9: 7, F10: 7, F11: 7, F12: 7, F13: 7, F14: 7, F15: 7, F16: 7,
      D17: 7, D18: 7, D19: 7, D20: 7, D21: 7, D22: 7, D23: 7, D24: 7,
      C25: 7, C26: 7, C27: 7, C28: 7, C29: 7, C30: 7, C31: 7, C32: 7,
    } as Answers,
    expectedCode: 'ICRD', // 모두 높은 점수이므로 Intrinsic/Change/Results/Direct
  },
];

// 테스트 실행
function runTests() {
  console.log('🧪 점수 계산 로직 테스트 시작\n');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\n[테스트 ${index + 1}] ${testCase.name}`);
    console.log('-'.repeat(60));

    try {
      const result = calculateScores(testCase.answers);

      // 코드 검증
      if (result.code === testCase.expectedCode) {
        console.log(`✅ 코드 일치: ${result.code}`);
        passed++;
      } else {
        console.log(`❌ 코드 불일치: 기대값=${testCase.expectedCode}, 실제값=${result.code}`);
        failed++;
      }

      // 점수 출력
      console.log('\n축별 점수:');
      result.scores.forEach((score) => {
        const avg1 = (score.score1 / 8).toFixed(2);
        const avg2 = (score.score2 / 8).toFixed(2);
        console.log(
          `  ${score.axis}: ${score.dimension1}=${avg1}, ${score.dimension2}=${avg2}, 우세=${score.dominant}`
        );
      });

      // DB 형식 변환 테스트
      const dbFormat = convertToDatabaseFormat(result);
      console.log('\nDB 저장 형식 (axis_scores):');
      console.log(JSON.stringify(dbFormat.axisScores, null, 2));
      console.log('\nDB 저장 형식 (pole):');
      console.log(JSON.stringify(dbFormat.pole, null, 2));
    } catch (error) {
      console.error(`❌ 테스트 실행 중 에러:`, error);
      failed++;
    }
  });

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 테스트 결과: 통과 ${passed}개, 실패 ${failed}개`);
  
  if (failed === 0) {
    console.log('✅ 모든 테스트가 통과했습니다!');
  } else {
    console.log('❌ 일부 테스트가 실패했습니다.');
    process.exit(1);
  }
}

// 스크립트 실행
runTests();

