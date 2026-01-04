# INSERT 반환값 제거 수정

## 문제

INSERT 후 `.select()`를 호출하면 SELECT 권한이 필요합니다. 하지만 `responses` 테이블의 SELECT 정책이 `USING (false)`로 설정되어 있어서, INSERT 후 반환값을 요청하면 전체 INSERT가 실패합니다.

## 해결 방법

1. **`.select()` 및 `.single()` 제거**: INSERT 후 반환값을 요청하지 않음
2. **`Prefer: return=minimal` 헤더 추가**: Supabase 클라이언트에 기본적으로 반환값을 요청하지 않도록 설정

## 수정 내용

### app/api/submit/route.ts

- `.select('id, created_at').single()` 제거
- `response.id`, `response.created_at` 대신 계산된 값 사용
- `submittedAt`은 현재 시각 사용

### lib/supabaseAdmin.ts

- `supabaseAnonymous` 클라이언트에 `Prefer: return=minimal` 헤더 추가
- INSERT 후 기본적으로 반환값을 요청하지 않도록 설정

## 테스트

서버 재시작 후 테스트:

```bash
npm run dev
# 새 터미널에서
bash scripts/test-simple.sh 3000
```

## 참고

- `return=minimal`: INSERT/UPDATE/DELETE 후 최소한의 정보만 반환 (보통 성공 여부만)
- `return=representation`: INSERT/UPDATE 후 전체 행 반환 (SELECT 권한 필요)
- SELECT 정책이 차단된 테이블에서는 `return=minimal`을 사용해야 함

