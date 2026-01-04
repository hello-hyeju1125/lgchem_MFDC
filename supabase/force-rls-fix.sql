-- ============================================
-- RLS 정책 강제 재설정 (완전 삭제 후 재생성)
-- ============================================

-- 1. 모든 정책 삭제 (에러 무시)
DO $$
BEGIN
  DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
  DROP POLICY IF EXISTS "responses_select_policy" ON responses;
  DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
  DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
EXCEPTION WHEN OTHERS THEN
  -- 정책이 없어도 계속 진행
  NULL;
END $$;

-- 2. RLS 일시적으로 비활성화 (확인용)
-- ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
-- 위 줄은 테스트용이므로 주석 처리했습니다

-- 3. RLS 활성화
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- 4. responses INSERT 정책 생성 (anon 명시)
CREATE POLICY "responses_insert_policy" ON responses
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. responses SELECT 정책
CREATE POLICY "responses_select_policy" ON responses
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- 6. sessions SELECT 정책
CREATE POLICY "sessions_select_policy" ON sessions
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7. question_map SELECT 정책
CREATE POLICY "question_map_select_policy" ON question_map
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 8. 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  with_check
FROM pg_policies
WHERE tablename = 'responses'
ORDER BY cmd;

-- 9. 테스트 세션 생성
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;

SELECT '✅ 정책 재설정 완료!' AS status;

