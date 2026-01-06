/**
 * test-session-001에 가상 데이터 50개 삽입 스크립트
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 파일 직접 읽기
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('⚠️  .env.local 파일을 읽을 수 없습니다. 환경 변수가 이미 설정되어 있다고 가정합니다.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 16가지 리더십 유형
const leadershipTypes = [
  'ICRD', 'ICRN', 'ICPD', 'ICPN',
  'ISRD', 'ISRN', 'ISPD', 'ISPN',
  'ECRD', 'ECRN', 'ECPD', 'ECPN',
  'ESRD', 'ESRN', 'ESPD', 'ESPN'
];

// 각 유형별 개수 (총 50개)
const typeDistribution = [4, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 3, 3];

// 유형 코드에서 각 축의 극성 추출
function getPolesFromType(type: string) {
  return {
    motivation: type[0] === 'I' ? 'intrinsic' : 'extrinsic',
    flexibility: type[1] === 'C' ? 'change' : 'system',
    direction: type[2] === 'R' ? 'results' : 'people',
    communication: type[3] === 'D' ? 'direct' : 'engage', // 'N'도 'engage'로 처리
  };
}

// 점수 생성 함수
function generateScores(pole: string, isDominant: boolean): number {
  if (isDominant) {
    return Math.round((5.0 + Math.random() * 1.5) * 100) / 100;
  } else {
    return Math.round((3.0 + Math.random() * 1.0) * 100) / 100;
  }
}

// 답변 생성 함수 (32문항)
function generateAnswers(poles: ReturnType<typeof getPolesFromType>) {
  const answers: Record<string, number> = {};
  
  // Motivation 축 (M1-M8: Intrinsic)
  for (let i = 1; i <= 8; i++) {
    answers[`M${i}`] = poles.motivation === 'intrinsic' 
      ? 4 + Math.floor(Math.random() * 4)
      : 1 + Math.floor(Math.random() * 3);
  }
  
  // Flexibility 축 (F9-F16: Change)
  for (let i = 9; i <= 16; i++) {
    answers[`F${i}`] = poles.flexibility === 'change'
      ? 4 + Math.floor(Math.random() * 4)
      : 1 + Math.floor(Math.random() * 3);
  }
  
  // Direction 축 (D17-D24: Results)
  for (let i = 17; i <= 24; i++) {
    answers[`D${i}`] = poles.direction === 'results'
      ? 4 + Math.floor(Math.random() * 4)
      : 1 + Math.floor(Math.random() * 3);
  }
  
  // Communication 축 (C25-C32: Direct)
  for (let i = 25; i <= 32; i++) {
    answers[`C${i}`] = poles.communication === 'direct'
      ? 4 + Math.floor(Math.random() * 4)
      : 1 + Math.floor(Math.random() * 3);
  }
  
  return answers;
}

async function insertTestData() {
  try {
    console.log('🚀 test-session-001에 가상 데이터 삽입 시작...\n');

    // 1. 세션 확인 및 생성
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('session_code', 'test-session-001')
      .single();

    let sessionId: string;

    if (sessionError || !session) {
      console.log('📝 test-session-001 세션 생성 중...');
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert({
          session_code: 'test-session-001',
          title: '테스트 세션',
          starts_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select('id')
        .single();

      if (createError || !newSession) {
        throw new Error(`세션 생성 실패: ${createError?.message}`);
      }
      sessionId = newSession.id;
      console.log('✅ 세션 생성 완료\n');
    } else {
      sessionId = session.id;
      console.log('✅ 기존 세션 사용\n');
    }

    // 2. 기존 데이터 삭제 (선택사항)
    console.log('🗑️  기존 응답 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('responses')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      console.warn('⚠️  기존 데이터 삭제 실패 (무시하고 계속):', deleteError.message);
    } else {
      console.log('✅ 기존 데이터 삭제 완료\n');
    }

    // 3. 데이터 삽입
    console.log('📊 가상 데이터 삽입 중...\n');
    const responses = [];

    for (let typeIndex = 0; typeIndex < leadershipTypes.length; typeIndex++) {
      const type = leadershipTypes[typeIndex];
      const count = typeDistribution[typeIndex];
      const poles = getPolesFromType(type);

      for (let i = 0; i < count; i++) {
        const axisScores = {
          motivation: {
            intrinsic: generateScores('intrinsic', poles.motivation === 'intrinsic'),
            extrinsic: generateScores('extrinsic', poles.motivation === 'extrinsic'),
          },
          flexibility: {
            change: generateScores('change', poles.flexibility === 'change'),
            system: generateScores('system', poles.flexibility === 'system'),
          },
          direction: {
            results: generateScores('results', poles.direction === 'results'),
            people: generateScores('people', poles.direction === 'people'),
          },
          communication: {
            direct: generateScores('direct', poles.communication === 'direct'),
            engage: generateScores('engage', poles.communication === 'engage'),
          },
        };

        const answers = generateAnswers(poles);

        // 랜덤 시간 생성 (최근 7일 내)
        const randomDaysAgo = Math.random() * 7;
        const createdAt = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000);

        responses.push({
          session_id: sessionId,
          leadership_type: type,
          axis_scores: axisScores,
          pole: poles,
          answers: answers,
          created_at: createdAt.toISOString(),
        });
      }
    }

    // 배치 삽입
    const { data, error } = await supabase
      .from('responses')
      .insert(responses)
      .select('id');

    if (error) {
      throw new Error(`데이터 삽입 실패: ${error.message}`);
    }

    console.log(`✅ ${responses.length}개의 응답 데이터 삽입 완료!\n`);

    // 4. 삽입된 데이터 확인
    console.log('📈 삽입된 데이터 통계:\n');
    const { data: stats, error: statsError } = await supabase
      .from('responses')
      .select('leadership_type')
      .eq('session_id', sessionId);

    if (!statsError && stats) {
      const typeCounts: Record<string, number> = {};
      stats.forEach((r) => {
        typeCounts[r.leadership_type] = (typeCounts[r.leadership_type] || 0) + 1;
      });

      Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`  ${type}: ${count}개`);
        });
    }

    console.log('\n✨ 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

insertTestData();

