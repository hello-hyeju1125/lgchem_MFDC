# 완전 초기화 가이드

## 문제 상황

여러 번 SQL을 실행하여 정책이 중복되거나 충돌할 수 있습니다.

## 해결 방법: 완전 초기화

### 1단계: 완전 초기화 SQL 실행

Supabase SQL Editor에서 `supabase/complete-reset.sql` 파일의 **전체 내용**을 실행하세요.

이 SQL은:
1. 현재 정책 상태를 확인합니다
2. 모든 정책을 삭제합니다
3. 정책을 깨끗하게 재생성합니다
4. 최종 상태를 확인합니다

### 2단계: 실행 결과 확인

SQL 실행 후 다음을 확인하세요:

**1단계 결과 (현재 정책 상태):**
- 몇 개의 정책이 있는지 확인

**3단계 결과 (정책 삭제 확인):**
- `remaining_policies`가 `0`이어야 함

**8단계 결과 (최종 정책 상태):**
- `responses_insert_policy`의 `status`가 `✅ OK`여야 함
- `with_check`가 `true`여야 함
- `roles`에 `anon`이 포함되어야 함

### 3단계: 서버 재시작

SQL 실행 후 서버를 재시작:

```bash
# 서버 중지 (Ctrl+C 또는 Cmd+C)
# 서버 재시작
npm run dev
```

### 4단계: 테스트

```bash
bash scripts/test-simple.sh 3000
```
(포트 번호는 실제 실행 포트로 변경)

## 문제가 계속되면

### 옵션 A: RLS 일시 비활성화 (테스트용)

임시로 RLS를 비활성화하여 테스트:

```sql
-- RLS 비활성화 (테스트용)
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;

-- 테스트 후 다시 활성화
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
```

**주의:** 테스트 후에는 반드시 다시 활성화하세요!

### 옵션 B: 정책을 직접 확인

Supabase Dashboard > Authentication > Policies에서:
1. `responses` 테이블의 정책 목록 확인
2. 중복된 정책이 있으면 수동으로 삭제
3. `responses_insert_policy` 정책 확인:
   - Command: INSERT
   - Target roles: anon, authenticated
   - WITH CHECK: true

### 옵션 C: Service Role Key 사용 (임시)

테스트 목적으로 Service Role Key를 사용 (RLS 우회):

**주의:** 이는 테스트용이며, 프로덕션에서는 사용하지 마세요!

`app/api/submit/route.ts`에서 임시로 `supabaseAdmin`을 사용:
```typescript
// 임시 테스트용 (RLS 우회)
const { data: response, error: insertError } = await supabaseAdmin
  .from('responses')
  .insert({...})
```

테스트 후 다시 `supabaseAnonymous`로 변경하세요.

## 체크리스트

- [ ] `complete-reset.sql` 실행 완료
- [ ] 정책 삭제 확인 (remaining_policies = 0)
- [ ] 정책 재생성 확인 (responses_insert_policy 존재)
- [ ] with_check = true 확인
- [ ] 서버 재시작 완료
- [ ] 테스트 실행

