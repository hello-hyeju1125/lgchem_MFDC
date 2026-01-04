-- 최종 RLS 정책 수정 스크립트
-- 이 스크립트는 모든 기존 정책을 제거하고 올바르게 재생성합니다
-- Supabase SQL Editor에서 실행하세요

BEGIN;

-- 1. responses 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
DROP POLICY IF EXISTS "responses_select_policy" ON responses;
DROP POLICY IF EXISTS "responses_update_policy" ON responses;
DROP POLICY IF EXISTS "responses_delete_policy" ON responses;

-- 2. sessions 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_policy" ON sessions;

-- 3. question_map 테이블의 모든 기존 정책 삭제
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
DROP POLICY IF EXISTS "question_map_insert_policy" ON question_map;
DROP POLICY IF EXISTS "question_map_update_policy" ON question_map;
DROP POLICY IF EXISTS "question_map_delete_policy" ON question_map;

-- 4. RLS 활성화 확인
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- ========================================
-- responses 테이블 정책 생성
-- ========================================

-- INSERT 정책: anon과 authenticated가 모두 INSERT 가능
-- WITH CHECK (true)가 핵심! 이것이 없으면 INSERT가 실패합니다
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT 정책: 직접 SELECT는 불가 (RPC를 통해서만 접근)
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- UPDATE/DELETE 정책: 일반 사용자는 불가
-- (필요시 나중에 추가)

-- ========================================
-- sessions 테이블 정책 생성
-- ========================================

-- SELECT 정책: session_code 조회를 위해 anon도 SELECT 가능
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE는 관리자만 가능 (필요시 service_role로 처리)

-- ========================================
-- question_map 테이블 정책 생성
-- ========================================

-- SELECT 정책: 모든 사용자가 질문 매핑 정보 조회 가능
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMIT;

-- 검증 쿼리 (정책이 올바르게 생성되었는지 확인)
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  CASE 
    WHEN tablename = 'responses' AND cmd = 'INSERT' AND with_check = 'true' THEN '✅ INSERT 가능 (정상)'
    WHEN tablename = 'responses' AND cmd = 'SELECT' AND qual = 'false' THEN '✅ SELECT 차단 (의도된 동작)'
    WHEN tablename = 'sessions' AND cmd = 'SELECT' AND qual = 'true' THEN '✅ SELECT 가능 (정상)'
    WHEN tablename = 'question_map' AND cmd = 'SELECT' AND qual = 'true' THEN '✅ SELECT 가능 (정상)'
    ELSE '⚠️ 확인 필요'
  END as status
FROM pg_policies
WHERE tablename IN ('responses', 'sessions', 'question_map')
ORDER BY tablename, cmd, policyname;

