# API 키 확인 가이드

## 문제

현재 `.env.local` 파일의 API 키가 `sb_publishable_...` 형식입니다. 이것이 올바른 형식인지 확인이 필요합니다.

## Supabase API 키 형식

### 올바른 형식

Supabase REST API를 사용하려면 **JWT 토큰 형식**의 키가 필요합니다:

- **형식**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...`
- **시작**: `eyJ` (Base64로 인코딩된 JWT)
- **길이**: 200자 이상 (매우 긴 문자열)
- **위치**: Supabase Dashboard > Settings > API > **anon public** 키

### 현재 형식

- `sb_publishable_...` - 이것은 Supabase CLI나 다른 도구의 키 형식일 수 있습니다
- REST API에는 작동하지 않을 수 있습니다

## 확인 방법

### 1단계: Supabase Dashboard에서 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings > API** 메뉴로 이동
4. **Project API keys** 섹션에서:
   - **anon public** 키 찾기
   - **"Reveal"** 버튼 클릭 (키를 보려면)
   - 전체 키 복사

**중요:**
- 키는 `eyJ`로 시작해야 합니다
- 매우 긴 문자열입니다 (200자 이상)
- 키 전체를 복사해야 합니다

### 2단계: .env.local 파일 수정

복사한 키로 `.env.local` 파일을 업데이트:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://iqbytifnvtqrdsvrvdte.supabase.co

# anon public 키 (JWT 형식, eyJ로 시작)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnl0aWZudnRxcmRzdnJ2ZHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk3NzM4NjIsImV4cCI6MjAwNTM0OTg2Mn0.실제키여기...

# service_role 키 (JWT 형식)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYnl0aWZudnRxcmRzdnJ2ZHRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTc3Mzg2MiwiZXhwIjoyMDA1MzQ5ODYyfQ.실제키여기...

ADMIN_KEY=lgchem-leadership-admin-2026-secure
```

### 3단계: 서버 재시작

**반드시 서버를 재시작**하세요:

```bash
# 서버 중지 (Ctrl+C 또는 Cmd+C)
# 서버 재시작
npm run dev
```

### 4단계: 테스트

```bash
bash scripts/test-simple.sh 3000
```

## 키가 없거나 찾을 수 없으면

Supabase Dashboard > Settings > API에서:
- 키가 표시되지 않으면 프로젝트 설정 확인
- 키를 재생성할 수도 있지만, 기존 키가 있으면 그것을 사용하는 것이 좋습니다

## 확인 체크리스트

- [ ] Supabase Dashboard > Settings > API 접속
- [ ] anon public 키 확인 (eyJ로 시작)
- [ ] 키 전체 복사 (200자 이상)
- [ ] .env.local 파일에 붙여넣기
- [ ] 서버 재시작
- [ ] 테스트 실행

