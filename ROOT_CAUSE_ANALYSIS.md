# 근본 원인 분석: 42501 에러

## 로그 분석 결과

Supabase 로그를 분석한 결과:

### 확인된 사항
1. ✅ JWT 토큰은 올바르게 파싱됨 (`role: "anon"`)
2. ✅ 요청이 Supabase에 도달함
3. ❌ `PostgREST; error=42501` - 권한 부족
4. ❌ HTTP 401 Unauthorized

### 가능한 원인들

#### 1. API 키 형식 문제 (가장 유력)

`.env.local` 파일의 키가 `sb_publishable_...` 형식인데, 이것이 올바른 형식이 아닐 수 있습니다.

**Supabase의 올바른 API 키 형식:**
- **anon public 키**: JWT 토큰 형식 (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
- 매우 긴 문자열 (200자 이상)
- Base64로 인코딩된 JSON 웹 토큰

**현재 키 형식:**
- `sb_publishable_...` - 이것은 Supabase CLI나 다른 도구에서 사용하는 형식일 수 있습니다
- REST API에는 JWT 형식의 키가 필요합니다

#### 2. RLS 정책 문제

정책이 존재하더라도:
- 정책의 역할이 올바르지 않을 수 있음
- 정책이 실제로 적용되지 않았을 수 있음
- 다른 정책과 충돌할 수 있음

#### 3. 환경 변수 로드 문제

Next.js 서버가 환경 변수를 제대로 로드하지 못했을 수 있음

## 해결 방법

### 방법 1: API 키 확인 및 교체 (가장 중요)

1. **Supabase Dashboard > Settings > API**로 이동
2. **Project API keys** 섹션에서:
   - **anon public** 키를 확인
   - "Reveal" 버튼을 클릭하여 전체 키 복사
   - 키는 `eyJ`로 시작하는 매우 긴 문자열이어야 함 (200자 이상)

3. `.env.local` 파일 수정:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnl0aWZudnRxcmRzdnJ2ZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk3NzM4NjIsImV4cCI6MjAwNTM0OTg2Mn0.xxx...
   ```
   (실제 키로 교체)

4. **서버 재시작** (매우 중요!)

### 방법 2: RLS 정책 재확인

Supabase SQL Editor에서:

```sql
-- 정책 상세 확인
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles::text,
  qual,
  with_check,
  CASE 
    WHEN tablename = 'responses' AND cmd = 'INSERT' 
      AND with_check = 'true' 
      AND roles::text LIKE '%anon%'
    THEN '✅ OK'
    ELSE '❌ 문제'
  END as status
FROM pg_policies
WHERE tablename = 'responses';
```

**예상 결과:**
- `responses_insert_policy` 존재
- `cmd` = `INSERT`
- `with_check` = `true`
- `roles`에 `anon` 포함
- `status` = `✅ OK`

### 방법 3: RLS 일시 비활성화 (테스트용)

정책 문제를 배제하기 위해 임시로 RLS를 비활성화:

```sql
-- RLS 비활성화 (테스트용)
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
```

테스트 후:
```sql
-- 다시 활성화
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
-- 정책 재생성
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

### 방법 4: Service Role Key로 테스트 (임시)

RLS를 우회하여 테스트 (프로덕션에서는 사용하지 말 것):

`app/api/submit/route.ts`에서 임시로 `supabaseAdmin` 사용:

```typescript
// 임시 테스트 (RLS 우회)
const { data: response, error: insertError } = await supabaseAdmin
  .from('responses')
  .insert({...})
```

이것이 작동하면 문제는 RLS 정책입니다.
이것도 실패하면 다른 문제입니다.

## 우선순위

1. **가장 먼저**: API 키 확인 및 교체 (JWT 형식인지 확인)
2. 서버 재시작
3. RLS 정책 재확인
4. RLS 일시 비활성화로 테스트
5. Service Role Key로 테스트

