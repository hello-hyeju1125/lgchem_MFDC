# 빠른 확인 가이드

## SELECT 정책의 ⚠️ 표시는 정상입니다!

`responses_select_policy / SELECT ⚠️` 표시는 **의도된 동작**입니다. 걱정하지 마세요!

## 중요한 것: INSERT 정책 확인

INSERT 정책이 올바른지 확인하는 것이 **가장 중요**합니다.

Supabase SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- INSERT 정책 확인
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
  END as status
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';
```

**예상 결과:**
- `status` = `✅ 올바름 - INSERT 가능!`
- `with_check` = `true`
- `roles`에 `anon` 포함

## 다음 단계

INSERT 정책이 `✅ 올바름`이면:

1. **서버 재시작**: Next.js 서버 재시작
   ```bash
   npm run dev
   ```

2. **테스트**: API 제출 테스트
   ```bash
   bash scripts/test-simple.sh 3000
   ```

## 정책 설계 요약

| 테이블 | 정책 | 상태 | 설명 |
|--------|------|------|------|
| responses | INSERT | ✅ 허용 | API 제출을 위해 필수 |
| responses | SELECT | ✅ 차단 (의도) | 개인 정보 보호, RPC로만 접근 |
| sessions | SELECT | ✅ 허용 | session_code 조회용 |
| question_map | SELECT | ✅ 허용 | 질문 매핑 조회용 |

**SELECT 정책의 차단은 의도된 것입니다!** INSERT만 올바르면 됩니다.

