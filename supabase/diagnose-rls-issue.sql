-- RLS 정책 진단 스크립트
-- Supabase SQL Editor에서 실행하여 현재 상태를 확인합니다

-- 1. RLS 활성화 상태 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('responses', 'sessions', 'question_map')
ORDER BY tablename;

-- 2. responses 테이블의 모든 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text as roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'responses'
ORDER BY cmd, policyname;

-- 3. INSERT 정책 상세 확인 (중요!)
SELECT 
  policyname,
  cmd,
  permissive,
  roles::text,
  CASE 
    WHEN with_check IS NULL THEN 'NULL'
    WHEN with_check = '' THEN '빈 문자열'
    WHEN with_check = 'true' THEN '✅ true'
    ELSE '⚠️ ' || with_check
  END as with_check_status,
  CASE 
    WHEN roles::text LIKE '%anon%' THEN '✅ anon 포함'
    ELSE '❌ anon 없음'
  END as anon_check
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';

-- 4. 세션 테이블 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  qual
FROM pg_policies
WHERE tablename = 'sessions'
ORDER BY cmd, policyname;

-- 5. 정책 존재 여부 확인 (간단 버전)
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE tablename IN ('responses', 'sessions', 'question_map')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

