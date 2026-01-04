# RLS 정책 설명: SELECT 정책의 ⚠️ 표시는 정상입니다

## 중요한 점

**`responses_select_policy / SELECT ⚠️` 표시는 정상입니다!**

이것은 **의도된 동작**입니다. SELECT 정책이 `USING (false)`로 설정되어 있어서 검증 쿼리가 `⚠️`로 표시하는 것이지만, 이것은 우리가 원하는 동작입니다.

## 정책 설계 의도

### responses 테이블 정책

1. **INSERT 정책** (`responses_insert_policy`)
   - ✅ `WITH CHECK (true)` - 모든 anon/authenticated 사용자가 INSERT 가능
   - **이것이 중요합니다!** API 제출이 작동하려면 이 정책이 올바르게 설정되어 있어야 합니다.

2. **SELECT 정책** (`responses_select_policy`)
   - ✅ `USING (false)` - 일반 사용자의 직접 SELECT 차단
   - **의도된 동작**: 개인 정보 보호를 위해 직접 SELECT를 차단합니다.
   - RPC 함수(`SECURITY DEFINER`)를 통해서만 집계 데이터에 접근 가능합니다.

### sessions 테이블 정책

- **SELECT 정책**: `USING (true)` - session_code로 session_id를 조회하기 위해 허용

### question_map 테이블 정책

- **SELECT 정책**: `USING (true)` - 질문 매핑 정보 조회를 위해 허용

## 확인 방법

**INSERT 정책이 올바른지 확인하는 것이 가장 중요합니다!**

Supabase SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- INSERT 정책 확인 (가장 중요!)
SELECT 
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' 
      AND with_check = 'true' 
      AND roles::text LIKE '%anon%'
    THEN '✅ 올바름 - INSERT 가능'
    ELSE '❌ 문제 - INSERT 불가'
  END as status
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';
```

**예상 결과:**
- `status` = `✅ 올바름 - INSERT 가능`
- `with_check` = `true`
- `roles`에 `anon` 포함

## 검증 스크립트

더 자세한 확인을 원하면 `supabase/verify-policies.sql` 파일을 실행하세요.

이 스크립트는:
- 각 정책의 상태를 개별적으로 확인
- INSERT 정책이 올바른지 확인 (가장 중요!)
- SELECT 정책이 의도대로 차단되어 있는지 확인
- sessions와 question_map 정책 확인

## 다음 단계

1. **INSERT 정책 확인**: 위의 쿼리로 `✅ 올바름`이 나오는지 확인
2. **서버 재시작**: Next.js 서버 재시작 (`npm run dev`)
3. **테스트**: API 제출 테스트

SELECT 정책의 `⚠️` 표시는 무시해도 됩니다. INSERT 정책만 올바르면 됩니다!

