# INSERT 반환값 제거 수정 완료

## 수정 내용

### 1. app/api/submit/route.ts

- `.select('id, created_at').single()` 제거
- INSERT 후 반환값을 요청하지 않음
- `response.id`, `response.created_at` 대신 계산된 값 사용

**변경 전:**
```typescript
const { data: response, error: insertError } = await supabaseAnonymous
  .from('responses')
  .insert({...})
  .select('id, created_at')
  .single();
```

**변경 후:**
```typescript
const { error: insertError } = await supabaseAnonymous
  .from('responses')
  .insert({...});
```

### 2. lib/supabaseAdmin.ts

- `global.headers`에 `Prefer: return=minimal` 추가 (선택사항, 기본 동작과 동일)

## 테스트

1. **서버 재시작** (필수!)
   ```bash
   npm run dev
   ```

2. **테스트 실행**
   ```bash
   bash scripts/test-simple.sh 3000
   ```

## 예상 결과

- INSERT가 성공하면 HTTP 200 응답
- `success: true` 반환
- `id`와 `submittedAt`은 계산된 값 (실제 DB 값이 아님)

## 참고

- Supabase는 기본적으로 `.select()`를 호출하지 않으면 INSERT 후 반환값을 요청하지 않습니다
- `Prefer: return=minimal` 헤더는 추가 보장이지만, 기본 동작과 동일합니다
- SELECT 권한이 없어도 INSERT는 정상 작동해야 합니다

