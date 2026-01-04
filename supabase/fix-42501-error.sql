-- ============================================
-- 42501 에러 해결: RLS 정책 완전 재설정
-- ============================================
-- PostgREST error=42501: insufficient_privilege
-- 이는 RLS 정책이 INSERT를 허용하지 않는다는 의미입니다
-- ============================================

-- 1. 기존 정책 완전 삭제
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
DROP POLICY IF EXISTS "responses_select_policy" ON responses;
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;

-- 2. RLS 활성화 확인
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- 3. responses 테이블 INSERT 정책 생성
-- 중요: WITH CHECK (true)가 있어야 INSERT가 허용됩니다
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. responses 테이블 SELECT 정책 (차단)
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  USING (false);

-- 5. sessions 테이블 SELECT 정책
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. question_map 테이블 SELECT 정책
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7. 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename, cmd;

-- 8. 테스트 세션 생성 (없을 경우)
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;

SELECT '✅ RLS 정책 재설정 완료! 이제 테스트해보세요.' AS status;

