-- 현재 RLS 정책 상태 확인

-- 1. responses 테이블의 모든 정책 확인
SELECT 
  'responses' as table_name,
  policyname,
  cmd,
  roles::text,
  qual,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' AND with_check = 'true' AND roles::text LIKE '%anon%' THEN '✅ 올바름'
    WHEN cmd = 'INSERT' THEN '⚠️ 문제 있음'
    ELSE '확인 필요'
  END as status
FROM pg_policies
WHERE tablename = 'responses'
ORDER BY cmd;

-- 2. RLS 활성화 상태 확인
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ 활성화' ELSE '❌ 비활성화' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'responses';

-- 3. 모든 정책 목록
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename, cmd;

