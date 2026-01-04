# 세션 조회 문제 해결 가이드

## 문제 상황

API 호출 시 다음 에러가 발생:
```
{"success":false,"error":"유효하지 않은 세션 코드입니다","details":"Cannot coerce the result to a single JSON object"}
```

## 원인

Supabase에서 세션을 조회할 때 `.single()` 메서드를 사용했는데, 세션이 없거나 여러 개일 때 에러가 발생합니다.

## 해결 방법

### 1단계: Supabase에서 세션 확인

Supabase Dashboard > SQL Editor에서 다음 SQL을 실행하세요:

```sql
-- 현재 세션 확인
SELECT id, session_code, title, created_at 
FROM sessions 
WHERE session_code = 'test-session-001';
```

**결과가 없으면** 다음 SQL로 세션을 생성하세요:

```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;
```

### 2단계: 코드 수정 적용

코드가 수정되었으므로 **서버를 재시작**하세요:

1. 개발 서버 중지 (Ctrl+C 또는 Cmd+C)
2. 서버 재시작:
   ```bash
   npm run dev
   ```

### 3단계: 테스트 재실행

서버가 재시작된 후:

```bash
bash scripts/test-simple.sh 3009
```

(포트 번호는 실제 실행 포트로 변경)

### 4단계: 예상 결과

이제 더 명확한 에러 메시지가 나올 것입니다:

- **세션이 없을 때:**
  ```json
  {
    "success": false,
    "error": "유효하지 않은 세션 코드입니다",
    "details": "세션 코드 \"test-session-001\"를 찾을 수 없습니다. Supabase에서 세션이 생성되었는지 확인하세요."
  }
  ```

- **성공 시:**
  ```json
  {
    "success": true,
    "data": {
      "id": "...",
      "leadershipType": "ICRD",
      "scores": [...]
    }
  }
  ```

## 빠른 확인 방법

터미널에서 다음 명령어로 세션 확인 SQL을 확인할 수 있습니다:

```bash
bash scripts/check-session.sh
```

이 스크립트는 Supabase SQL Editor에서 실행할 SQL을 출력합니다.

## 추가 문제 해결

### RLS 정책 문제

만약 세션이 있는데도 조회가 안 된다면, RLS 정책 문제일 수 있습니다.

Supabase Dashboard > Authentication > Policies에서:
- `sessions` 테이블에 SELECT 정책이 있는지 확인
- 또는 `supabase/schema.sql`의 RLS 정책 부분을 다시 실행

### 세션 코드 확인

실제 생성된 세션 코드를 확인:

```sql
SELECT session_code FROM sessions ORDER BY created_at DESC;
```

테스트 스크립트에서 사용하는 세션 코드와 일치하는지 확인하세요.

