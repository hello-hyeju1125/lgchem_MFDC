# 단계별 문제 해결 가이드

## 현재 상황
- HTTP 500 에러 발생
- "new row violates row-level security policy for table \"responses\"" 에러

## 단계별 검증

### 1단계: RLS 정책 확인

Supabase SQL Editor에서 다음 SQL을 실행하여 정책이 존재하는지 확인:

```sql
-- responses 테이블의 모든 정책 확인
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'responses';
```

**예상 결과:**
- `responses_insert_policy` 정책이 있어야 함
- `cmd`가 `INSERT`여야 함
- `roles`에 `anon`이 포함되어야 함

**정책이 없거나 잘못되었다면:**
`supabase/fix-rls-policies.sql` 파일을 실행하세요.

### 2단계: RLS 활성화 확인

```sql
-- RLS가 활성화되어 있는지 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('sessions', 'responses', 'question_map');
```

**예상 결과:**
- 모든 테이블의 `rowsecurity`가 `true`여야 함

### 3단계: 세션 존재 확인

```sql
-- 테스트 세션이 있는지 확인
SELECT id, session_code, title FROM sessions WHERE session_code = 'test-session-001';
```

**예상 결과:**
- 1개의 행이 반환되어야 함

**세션이 없다면:**
```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;
```

### 4단계: 환경 변수 확인

로컬에서 확인:
```bash
# .env.local 파일 확인
cat .env.local | grep SUPABASE
```

필요한 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5단계: 서버 재시작

코드나 환경 변수를 변경했다면 서버를 재시작:
```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

### 6단계: 간단한 테스트

```bash
bash scripts/test-simple.sh 3006
```

## 완전한 재설정 (모든 것이 실패할 경우)

Supabase SQL Editor에서 다음을 순서대로 실행:

### A. 모든 정책 삭제
```sql
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
DROP POLICY IF EXISTS "responses_select_policy" ON responses;
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
```

### B. 정책 재생성
```sql
-- responses INSERT 정책
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
```

### C. RLS 활성화
```sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;
```

### D. 테스트 세션 생성
```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;
```

## 다음 단계

각 단계의 결과를 확인하고, 어느 단계에서 문제가 발생하는지 알려주세요.

