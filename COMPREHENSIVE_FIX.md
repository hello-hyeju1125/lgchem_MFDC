# 종합 문제 해결 가이드: 42501 에러

## 현재 상황

- ✅ API 키는 올바른 JWT 형식 (`eyJ...`)
- ✅ JWT 토큰은 정상 파싱 (`role: "anon"`)
- ❌ `PostgREST; error=42501` - 권한 부족
- ❌ HTTP 401 Unauthorized

**결론: RLS 정책 문제입니다.**

## 해결 단계

### 1단계: 현재 RLS 정책 상태 확인

Supabase SQL Editor에서 다음 스크립트를 실행하여 현재 상태를 확인합니다:

```sql
-- supabase/diagnose-rls-issue.sql 파일의 내용 실행
```

또는 직접 실행:

```sql
-- responses 테이블의 INSERT 정책 확인
SELECT 
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' AND with_check = 'true' AND roles::text LIKE '%anon%' 
    THEN '✅ 올바름'
    ELSE '❌ 문제'
  END as status
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';
```

**예상 결과:**
- `responses_insert_policy` 존재
- `cmd` = `INSERT`
- `roles`에 `anon` 포함
- `with_check` = `true`
- `status` = `✅ 올바름`

### 2단계: RLS 정책 완전 재생성

정책이 올바르지 않거나 누락된 경우, 다음 스크립트로 완전히 재생성합니다:

**Supabase SQL Editor에서 실행:**

1. `supabase/final-rls-fix.sql` 파일의 전체 내용을 복사
2. SQL Editor에 붙여넣기
3. 실행 (Run)

이 스크립트는:
- 모든 기존 정책 삭제
- RLS 활성화 확인
- 올바른 정책 재생성
- 검증 쿼리 실행

### 3단계: 정책 확인

스크립트 실행 후, 검증 쿼리 결과를 확인합니다:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  CASE 
    WHEN cmd = 'INSERT' AND with_check = 'true' THEN '✅'
    ELSE '⚠️'
  END as status
FROM pg_policies
WHERE tablename = 'responses'
ORDER BY cmd;
```

**필수 확인 사항:**
- `responses_insert_policy` 존재
- `cmd` = `INSERT`
- `with_check` = `true` (NULL이면 안 됨!)
- `roles`에 `anon` 포함

### 4단계: 서버 재시작

RLS 정책을 변경한 후에는 **반드시 Next.js 서버를 재시작**해야 합니다:

```bash
# 서버 중지 (Ctrl+C 또는 Cmd+C)
# 서버 재시작
npm run dev
```

### 5단계: 테스트

```bash
bash scripts/test-simple.sh 3000
```

## 문제가 계속되면

### 대안 1: RLS 완전 비활성화 (테스트용)

문제를 격리하기 위해 임시로 RLS를 비활성화:

```sql
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
```

테스트 후 다시 활성화:

```sql
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
-- 그리고 정책 재생성
```

### 대안 2: Service Role Key로 테스트 (임시)

`app/api/submit/route.ts`에서 임시로 `supabaseAdmin` 사용:

```typescript
// 임시 테스트 (RLS 우회)
const { data: response, error: insertError } = await supabaseAdmin
  .from('responses')
  .insert({...})
```

이것이 작동하면 → RLS 정책 문제
이것도 실패하면 → 다른 문제 (테이블 구조, 컬럼 타입 등)

## 체크리스트

- [ ] `diagnose-rls-issue.sql` 실행하여 현재 상태 확인
- [ ] `final-rls-fix.sql` 실행하여 정책 재생성
- [ ] 검증 쿼리로 정책 확인 (`with_check = true`, `anon` 포함)
- [ ] Next.js 서버 재시작
- [ ] 테스트 실행
- [ ] 여전히 실패하면 RLS 비활성화 테스트
- [ ] Service Role Key로 테스트

## 중요 참고사항

1. **WITH CHECK (true)가 핵심**: INSERT 정책에 `WITH CHECK (true)`가 없으면 INSERT가 실패합니다.

2. **정책 적용 시점**: 정책을 변경한 후에는 Supabase가 즉시 적용하지만, Next.js 서버는 재시작하는 것이 안전합니다.

3. **역할 확인**: 정책의 `roles`에 `anon`이 포함되어야 합니다. `authenticated`만 있으면 익명 사용자는 접근할 수 없습니다.

4. **권한 충돌**: 여러 정책이 충돌할 수 있으므로, 모든 기존 정책을 삭제하고 재생성하는 것이 가장 안전합니다.

