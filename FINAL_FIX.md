# 최종 해결 방법: 42501 에러

## 문제 분석

Supabase 로그에서 확인된 내용:
- **에러 코드**: `PostgREST; error=42501`
- **의미**: PostgreSQL 권한 부족 (insufficient_privilege)
- **원인**: RLS 정책이 INSERT를 허용하지 않음

JWT 토큰은 올바르게 파싱되고 있지만 (`role: "anon"`), RLS 정책이 INSERT를 차단하고 있습니다.

## 해결 방법

### Supabase SQL Editor에서 실행

`supabase/fix-42501-error.sql` 파일의 **전체 내용**을 복사해서 Supabase SQL Editor에서 실행하세요.

또는 아래 SQL을 직접 실행:

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
DROP POLICY IF EXISTS "responses_select_policy" ON responses;
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;

-- RLS 활성화
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- responses INSERT 정책 (중요: WITH CHECK (true) 필수!)
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- responses SELECT 정책 (차단)
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  USING (false);

-- sessions SELECT 정책
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- question_map SELECT 정책
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 정책 확인
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  with_check
FROM pg_policies
WHERE tablename = 'responses';

-- 테스트 세션 생성
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;
```

### 실행 후 확인

SQL 실행 후 다음 쿼리로 정책이 올바르게 생성되었는지 확인:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  with_check
FROM pg_policies
WHERE tablename = 'responses';
```

**예상 결과:**
- `responses_insert_policy` 정책이 있어야 함
- `cmd`가 `INSERT`여야 함
- `roles`에 `{anon,authenticated}`가 포함되어야 함
- `with_check`가 `true`여야 함

### 테스트

SQL 실행 후:

```bash
bash scripts/test-simple.sh 3006
```

## 핵심 포인트

1. **WITH CHECK (true) 필수**: INSERT 정책에는 반드시 `WITH CHECK (true)`가 있어야 합니다
2. **anon 역할 허용**: `TO anon, authenticated`로 설정해야 익명 사용자가 INSERT할 수 있습니다
3. **정책 확인**: SQL 실행 후 정책이 올바르게 생성되었는지 확인하세요

## 문제가 계속되면

1. Supabase Dashboard > Authentication > Policies에서 정책을 수동으로 확인
2. 정책을 삭제하고 다시 생성
3. Supabase Dashboard > Logs에서 추가 에러 확인

