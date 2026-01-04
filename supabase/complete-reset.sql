-- ============================================
-- 완전 초기화 및 재설정
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요
-- 기존 정책을 모두 삭제하고 깨끗하게 재생성합니다
-- ============================================

-- 1단계: 현재 정책 상태 확인 (실행 후 결과를 확인하세요)
SELECT 
  '=== 현재 정책 상태 ===' as info,
  tablename,
  policyname,
  cmd,
  roles::text,
  with_check
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename, policyname;

-- 2단계: 모든 정책 삭제
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- responses 테이블의 모든 정책 삭제
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'responses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON responses CASCADE', pol.policyname);
  END LOOP;
  
  -- sessions 테이블의 모든 정책 삭제
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON sessions CASCADE', pol.policyname);
  END LOOP;
  
  -- question_map 테이블의 모든 정책 삭제
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'question_map'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON question_map CASCADE', pol.policyname);
  END LOOP;
END $$;

-- 3단계: 정책 삭제 확인 (빈 결과가 나와야 함)
SELECT 
  '=== 정책 삭제 확인 ===' as info,
  COUNT(*) as remaining_policies
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map');

-- 4단계: RLS 활성화 확인 및 설정
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- 5단계: responses 테이블 정책 생성
CREATE POLICY "responses_insert_policy" ON responses
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "responses_select_policy" ON responses
  AS PERMISSIVE
  FOR SELECT
  USING (false);

-- 6단계: sessions 테이블 정책 생성
CREATE POLICY "sessions_select_policy" ON sessions
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7단계: question_map 테이블 정책 생성
CREATE POLICY "question_map_select_policy" ON question_map
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 8단계: 최종 정책 확인
SELECT 
  '=== 최종 정책 상태 ===' as info,
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  CASE 
    WHEN cmd = 'INSERT' AND with_check = 'true' AND roles::text LIKE '%anon%' THEN '✅ OK'
    WHEN cmd = 'SELECT' AND roles::text LIKE '%anon%' THEN '✅ OK'
    ELSE '⚠️ 확인 필요'
  END as status,
  with_check
FROM pg_policies
WHERE tablename IN ('sessions', 'responses', 'question_map')
ORDER BY tablename, cmd;

-- 9단계: 테스트 세션 생성
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;

SELECT '✅ 완전 초기화 및 재설정 완료!' AS final_status;

