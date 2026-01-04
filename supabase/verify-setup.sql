-- ============================================
-- 설정 검증 SQL
-- ============================================
-- Supabase SQL Editor에서 실행하여 설정을 확인하세요
-- ============================================

-- 1. 테이블 존재 확인
SELECT 
  'Tables' as check_type,
  table_name,
  CASE WHEN table_name IN ('sessions', 'responses', 'question_map') THEN '✅' ELSE '❌' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sessions', 'responses', 'question_map')
ORDER BY table_name;

-- 2. RLS 활성화 확인
SELECT 
  'RLS Status' as check_type,
  tablename as table_name,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename;

-- 3. RLS 정책 확인
SELECT 
  'RLS Policies' as check_type,
  tablename as table_name,
  policyname,
  cmd,
  CASE 
    WHEN roles::text LIKE '%anon%' THEN '✅ anon allowed'
    ELSE '❌ anon not allowed'
  END as anon_status,
  with_check
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename, cmd;

-- 4. 세션 확인
SELECT 
  'Sessions' as check_type,
  session_code,
  title,
  CASE WHEN session_code = 'test-session-001' THEN '✅ Test session exists' ELSE '⚠️' END as status
FROM sessions
ORDER BY created_at DESC
LIMIT 5;

-- 5. RPC 함수 확인
SELECT 
  'RPC Functions' as check_type,
  routine_name,
  CASE 
    WHEN routine_name IN ('get_type_distribution', 'get_axis_stats', 'get_session_aggregates') 
    THEN '✅' 
    ELSE '❌' 
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%'
ORDER BY routine_name;

