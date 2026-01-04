# API 키 확인 및 수정 가이드

## 문제
401 Unauthorized 에러 - API 키 문제

## 현재 .env.local 파일의 키 형식

현재 키가 `sb_publishable_...` 형식인데, 이것은 올바른 형식이 아닐 수 있습니다.

Supabase의 **anon public** 키는 일반적으로 JWT 토큰 형식으로 시작합니다:
- 올바른 형식: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT 토큰)
- 현재 형식: `sb_publishable_...` (다른 형식일 수 있음)

## 해결 방법

### 1단계: Supabase Dashboard에서 올바른 키 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings > API** 메뉴로 이동
4. 다음 섹션을 확인:

   **Project URL:**
   ```
   https://iqbytifnvtqrdsvrvdte.supabase.co
   ```

   **Project API keys** 섹션에서:
   - **anon public** 키 확인 (JWT 형식, `eyJ...`로 시작)
   - **service_role** 키 확인 (JWT 형식, `eyJ...`로 시작)

### 2단계: .env.local 파일 수정

Supabase Dashboard에서 복사한 키로 `.env.local` 파일을 업데이트:

```bash
# .env.local 파일을 열어서 다음처럼 수정:

NEXT_PUBLIC_SUPABASE_URL=https://iqbytifnvtqrdsvrvdte.supabase.co

# anon public 키 (JWT 형식이어야 함)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnl0aWZudnRxcmRzdnJ2ZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk3NzM4NjIsImV4cCI6MjAwNTM0OTg2Mn0.xxx...

# service_role 키 (JWT 형식이어야 함)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnl0aWZudnRxcmRzdnJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTc3Mzg2MiwiZXhwIjoyMDA1MzQ5ODYyfQ.xxx...

ADMIN_KEY=lgchem-leadership-admin-2026-secure
```

**중요:**
- 키는 `eyJ`로 시작하는 JWT 토큰 형식이어야 합니다
- 키 앞뒤에 공백이나 따옴표가 없어야 합니다
- 전체 키를 복사해야 합니다 (매우 길 수 있음)

### 3단계: 서버 재시작

환경 변수를 변경했다면 **반드시 서버를 재시작**:

1. 개발 서버 중지 (Ctrl+C 또는 Cmd+C)
2. 서버 재시작:
   ```bash
   npm run dev
   ```

### 4단계: 테스트

```bash
bash scripts/test-simple.sh 3006
```

## 키 형식 확인

Supabase Dashboard에서:
- **anon public** 키를 복사할 때 "Reveal" 버튼을 클릭해야 전체 키를 볼 수 있습니다
- 키는 매우 긴 문자열입니다 (200자 이상)
- `eyJ`로 시작하는 JWT 토큰 형식이어야 합니다

## 주의사항

- `sb_publishable_...` 형식은 Supabase CLI나 다른 도구에서 사용하는 형식일 수 있지만, REST API에는 JWT 형식의 키가 필요합니다
- Dashboard에서 직접 복사한 키를 사용하세요
- 키를 재생성했다면 새로운 키를 사용해야 합니다

