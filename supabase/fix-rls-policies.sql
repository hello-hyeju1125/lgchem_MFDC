-- RLS 정책 수정 SQL
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- ============================================
-- 1. responses 테이블 RLS 정책 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
DROP POLICY IF EXISTS "responses_select_policy" ON responses;

-- INSERT 정책 생성 (anonymous 사용자도 INSERT 가능)
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT 정책 (기본적으로 차단, RPC 함수에서만 접근)
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  USING (false);

-- ============================================
-- 2. sessions 테이블 RLS 정책 확인
-- ============================================

DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 3. question_map 테이블 RLS 정책 확인
-- ============================================

DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 4. RLS 활성화 확인
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. 정책 확인
-- ============================================

-- responses 테이블 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'responses';

-- sessions 테이블 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sessions';

SELECT '✅ RLS 정책 수정 완료!' AS status;

