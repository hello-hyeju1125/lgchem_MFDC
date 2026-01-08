/**
 * API 디버깅 스크립트
 * Node.js로 직접 실행하여 문제를 진단합니다.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 API 디버깅 시작\n');
console.log('='.repeat(60));

// 1. 환경 변수 확인
console.log('\n1️⃣ 환경 변수 확인:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 없음');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 설정됨' : '❌ 없음');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ 환경 변수가 누락되었습니다!');
  process.exit(1);
}

// 2. Supabase 클라이언트 생성
console.log('\n2️⃣ Supabase 클라이언트 생성...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 3. 세션 조회 테스트
console.log('\n3️⃣ 세션 조회 테스트...');
const sessionCode = 'test-session-001';

supabase
  .from('sessions')
  .select('id, session_code, title')
  .eq('session_code', sessionCode)
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('  ❌ 세션 조회 실패:', error.message);
      console.error('  💡 해결 방법: Supabase SQL Editor에서 세션을 생성하세요:');
      console.error(`     INSERT INTO sessions (session_code, title) VALUES ('${sessionCode}', '테스트 세션');`);
      process.exit(1);
    } else {
      console.log('  ✅ 세션 조회 성공:', data);
      return data;
    }
  })
  .then((session) => {
    if (!session) return;
    
    // 4. 데이터 삽입 테스트
    console.log('\n4️⃣ 데이터 삽입 테스트...');
    const testData = {
      session_id: session.id,
      leadership_type: 'TEST',
      axis_scores: {
        motivation: { intrinsic: 5.0, extrinsic: 3.0 },
        flexibility: { change: 4.5, system: 3.5 },
        direction: { work: 6.0, people: 2.0 },
        communication: { direct: 5.5, engage: 2.5 }
      },
      pole: {
        motivation: 'intrinsic',
        flexibility: 'change',
        direction: 'work',
        communication: 'direct'
      },
      answers: { M1: 5, M2: 6, M3: 4 } // 테스트용 일부 데이터
    };

    return supabase
      .from('responses')
      .insert(testData)
      .select('id')
      .single();
  })
  .then(({ data, error }) => {
    if (error) {
      console.error('  ❌ 데이터 삽입 실패:', error.message);
      console.error('  💡 에러 코드:', error.code);
      console.error('  💡 해결 방법:');
      console.error('     - RLS 정책이 올바르게 설정되었는지 확인');
      console.error('     - responses 테이블이 존재하는지 확인');
      console.error('     - Supabase Dashboard > Table Editor에서 확인');
      process.exit(1);
    } else {
      console.log('  ✅ 데이터 삽입 성공! ID:', data.id);
      console.log('\n✅ 모든 테스트 통과!');
      console.log('\n다음 단계:');
      console.log('  1. npm run dev로 서버 시작');
      console.log('  2. bash scripts/test-api.sh 실행');
    }
  })
  .catch((err) => {
    console.error('\n❌ 예상치 못한 에러:', err);
    process.exit(1);
  });

