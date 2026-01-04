-- sessions 테이블 RLS 정책 수정
-- anonymous 사용자가 세션 코드로 세션을 조회할 수 있도록 SELECT 정책 추가

-- 기존 정책 삭제
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;

-- SELECT 정책 생성 (anonymous 사용자도 조회 가능)
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- 세션 코드로 조회 가능 (공개 정보)

-- 확인
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'sessions';

