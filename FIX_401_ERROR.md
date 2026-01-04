# 401 Unauthorized 에러 해결 가이드

## 문제
Supabase API Gateway 로그에서 401 에러 발생:
```
POST | 401 | /rest/v1/responses
```

## 원인
401 에러는 **인증 실패**를 의미합니다. 다음 중 하나일 수 있습니다:

1. **Anonymous Key가 잘못됨**
2. **환경 변수가 서버에 로드되지 않음**
3. **Supabase 프로젝트의 API Key가 변경됨**

## 해결 방법

### 1단계: Supabase Dashboard에서 API Key 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings > API 메뉴로 이동
4. 다음 키들을 확인:
   - **Project URL**
   - **anon public** 키 (Anonymous Key)
   - **service_role** 키 (Service Role Key)

### 2단계: .env.local 파일 확인 및 수정

`.env.local` 파일을 열어서 키가 올바른지 확인하세요:

```bash
# .env.local 파일 확인
cat .env.local
```

**올바른 형식:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**주의사항:**
- `NEXT_PUBLIC_SUPABASE_URL`에는 `https://`가 포함되어야 합니다
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 `anon public` 키여야 합니다 (service_role이 아님!)
- 키 앞뒤에 공백이나 따옴표가 없어야 합니다

### 3단계: 환경 변수 업데이트

Supabase Dashboard에서 복사한 키로 `.env.local` 파일을 업데이트하세요:

```bash
# .env.local 파일 편집
# 키를 복사해서 붙여넣으세요
```

### 4단계: 서버 재시작

환경 변수를 변경했다면 **반드시 서버를 재시작**해야 합니다:

1. 개발 서버 중지 (Ctrl+C 또는 Cmd+C)
2. 서버 재시작:
   ```bash
   npm run dev
   ```

### 5단계: 테스트

서버 재시작 후:

```bash
bash scripts/test-simple.sh 3006
```

## 빠른 확인 방법

터미널에서 다음 명령어로 환경 변수가 올바르게 설정되었는지 확인:

```bash
# 환경 변수 확인 (값은 표시되지 않지만 길이는 확인 가능)
cd /Users/hello_hyeju/Downloads/lgchem_MFDC
node -e "
require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('URL:', url ? '✅ 설정됨 (' + url.substring(0, 30) + '...)' : '❌ 없음');
console.log('ANON_KEY:', anonKey ? '✅ 설정됨 (길이: ' + anonKey.length + ')' : '❌ 없음');
console.log('ANON_KEY 시작:', anonKey ? anonKey.substring(0, 20) + '...' : '없음');
"
```

**예상 결과:**
- URL: ✅ 설정됨 (https://iqbytifnvtqrdsvrvdte...)
- ANON_KEY: ✅ 설정됨 (길이: 200+)
- ANON_KEY 시작: eyJhbGciOiJIUzI1NiIs... (JWT 토큰 형식)

## 추가 확인사항

### Anonymous Key 형식 확인

Anonymous Key는 JWT 토큰 형식이어야 합니다 (보통 `eyJ`로 시작).

Supabase Dashboard > Settings > API에서:
- **anon public** 키를 사용해야 합니다
- **service_role** 키는 서버 사이드 전용이므로 클라이언트에서 사용하면 안 됩니다

### 키가 변경되었을 수 있음

Supabase에서 키를 재생성했다면:
1. 새로운 키를 `.env.local`에 업데이트
2. 서버 재시작

## 문제가 계속되면

1. Supabase Dashboard > Settings > API에서 키를 재확인
2. `.env.local` 파일의 키가 정확히 일치하는지 확인 (복사/붙여넣기 오류 없이)
3. 서버 재시작 확인
4. Supabase Dashboard > Logs에서 추가 에러 확인

