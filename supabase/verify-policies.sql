-- RLS 정책 검증 스크립트
-- 각 정책이 의도대로 설정되었는지 확인합니다

-- 1. responses 테이블의 INSERT 정책 확인 (가장 중요!)
SELECT 
  'INSERT 정책' as check_type,
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' 
      AND with_check = 'true' 
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - INSERT 가능'
    ELSE '❌ 문제 - INSERT 불가'
  END as status,
  'INSERT 정책은 with_check = true이고 anon 역할을 포함해야 합니다' as note
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';

-- 2. responses 테이블의 SELECT 정책 확인 (의도적으로 차단)
SELECT 
  'SELECT 정책' as check_type,
  policyname,
  cmd,
  roles::text,
  qual as using_expression,
  CASE 
    WHEN cmd = 'SELECT' 
      AND qual = 'false'
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - SELECT 차단 (의도된 동작)'
    ELSE '⚠️ 확인 필요'
  END as status,
  'SELECT 정책은 USING (false)로 설정되어 일반 사용자의 직접 SELECT를 차단합니다. RPC 함수를 통해서만 접근 가능합니다.' as note
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'SELECT';

-- 3. sessions 테이블 정책 확인
SELECT 
  'sessions SELECT 정책' as check_type,
  policyname,
  cmd,
  roles::text,
  qual as using_expression,
  CASE 
    WHEN cmd = 'SELECT' 
      AND qual = 'true'
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - SELECT 가능'
    ELSE '❌ 문제'
  END as status,
  'sessions 테이블은 session_code 조회를 위해 SELECT가 허용되어야 합니다' as note
FROM pg_policies
WHERE tablename = 'sessions' AND cmd = 'SELECT';

-- 4. question_map 테이블 정책 확인
SELECT 
  'question_map SELECT 정책' as check_type,
  policyname,
  cmd,
  roles::text,
  qual as using_expression,
  CASE 
    WHEN cmd = 'SELECT' 
      AND qual = 'true'
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - SELECT 가능'
    ELSE '❌ 문제'
  END as status,
  'question_map 테이블은 질문 매핑 조회를 위해 SELECT가 허용되어야 합니다' as note
FROM pg_policies
WHERE tablename = 'question_map' AND cmd = 'SELECT';

-- 5. 전체 정책 요약
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names,
  CASE 
    WHEN tablename = 'responses' AND cmd = 'INSERT' THEN '⚠️ INSERT 정책 확인 필요 (위 쿼리 결과 확인)'
    WHEN tablename = 'responses' AND cmd = 'SELECT' THEN '✅ SELECT 차단 (의도된 동작)'
    WHEN tablename = 'sessions' AND cmd = 'SELECT' THEN '✅ SELECT 허용 (정상)'
    WHEN tablename = 'question_map' AND cmd = 'SELECT' THEN '✅ SELECT 허용 (정상)'
    ELSE '✅'
  END as summary
FROM pg_policies
WHERE tablename IN ('responses', 'sessions', 'question_map')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

