-- INSERT 정책 확인 (가장 중요!)
-- 이 쿼리로 INSERT 정책이 올바른지 확인하세요

SELECT 
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' 
      AND with_check = 'true' 
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - INSERT 가능!'
    ELSE '❌ 문제 - INSERT 불가'
  END as status,
  'INSERT 정책이 ✅ 올바름이면 API 제출이 작동합니다' as note
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';

