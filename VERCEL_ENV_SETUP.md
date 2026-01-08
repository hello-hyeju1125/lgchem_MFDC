# Vercel 환경 변수 설정 가이드

## 🚨 현재 발생 중인 오류

```
Error: Missing NEXT_PUBLIC_SUPABASE_URL environment variable
```

이 오류는 Vercel에서 환경 변수가 설정되지 않아 발생합니다.

---

## ✅ 해결 방법: Vercel Dashboard에서 환경 변수 설정

### 1단계: Vercel 프로젝트로 이동

1. https://vercel.com 접속 후 로그인
2. 배포한 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Environment Variables** 클릭

### 2단계: 환경 변수 추가

다음 4개의 환경 변수를 **모두 추가**해야 합니다:

#### 필수 환경 변수 목록

| 환경 변수 이름 | 설명 | 예시 값 형식 |
|--------------|------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ADMIN_KEY` | 관리자 API 접근 키 | 임의의 긴 문자열 (예: `my-secure-admin-key-12345`) |

### 3단계: 각 환경 변수 추가 방법

각 환경 변수마다:

1. **Key** 입력란에 환경 변수 이름 입력 (예: `NEXT_PUBLIC_SUPABASE_URL`)
2. **Value** 입력란에 실제 값 입력
3. **Environment** 선택:
   - ✅ **Production** (필수)
   - ✅ **Preview** (권장)
   - ✅ **Development** (선택사항)
4. **Save** 버튼 클릭

**중요**: 각 환경 변수를 추가할 때마다 **Production, Preview, Development를 모두 선택**하는 것을 권장합니다.

### 4단계: Supabase 키 확인 방법

Supabase 키는 Supabase Dashboard에서 확인할 수 있습니다:

1. https://supabase.com 접속 후 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Settings** → **API** 클릭
4. 다음 정보 확인:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` 값으로 사용
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값으로 사용
   - **service_role** 키 → `SUPABASE_SERVICE_ROLE_KEY` 값으로 사용

⚠️ **주의**: `service_role` 키는 **절대 공개하지 마세요**. 서버 사이드에서만 사용됩니다.

### 5단계: ADMIN_KEY 생성

`ADMIN_KEY`는 임의의 긴 문자열입니다. 예시:

```
my-secure-admin-key-2024-lgchem-mfdc
```

또는 온라인 UUID 생성기를 사용:
- https://www.uuidgenerator.net/
- 생성된 UUID를 그대로 사용하거나, 원하는 문자열로 변경

### 6단계: 환경 변수 설정 후 재배포

환경 변수를 모두 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포의 **⋯** (점 3개) 메뉴 클릭
3. **Redeploy** 선택
4. 또는 GitHub에 새 커밋을 푸시하면 자동으로 재배포됩니다

---

## 🔍 환경 변수 확인 방법

### Vercel Dashboard에서 확인

1. **Settings** → **Environment Variables**에서 추가한 변수들이 모두 표시되는지 확인
2. 각 변수의 **Environment** 열에서 Production, Preview가 체크되어 있는지 확인

### 배포 로그에서 확인

환경 변수는 배포 로그에 표시되지 않습니다 (보안상의 이유). 하지만 빌드가 성공하면 환경 변수가 올바르게 설정된 것입니다.

---

## ❌ 자주 발생하는 실수

### 1. 환경 변수 이름 오타
- ❌ `NEXT_PUBLIC_SUPABASE_URL` (대문자)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (정확히 동일하게)

### 2. Production 환경 미선택
- 환경 변수를 추가할 때 **Production**을 선택하지 않으면 프로덕션 배포에서 사용할 수 없습니다.

### 3. 값에 공백 포함
- 환경 변수 값 앞뒤에 공백이 있으면 안 됩니다.
- 복사/붙여넣기 시 주의하세요.

### 4. Supabase 키 혼동
- `anon public` 키와 `service_role` 키를 혼동하지 마세요.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`에는 `anon public` 키를 사용합니다.
- `SUPABASE_SERVICE_ROLE_KEY`에는 `service_role` 키를 사용합니다.

---

## 📋 체크리스트

환경 변수 설정 완료 후 확인:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 추가됨 (Production 체크됨)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가됨 (Production 체크됨)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 추가됨 (Production 체크됨)
- [ ] `ADMIN_KEY` 추가됨 (Production 체크됨)
- [ ] 모든 환경 변수 값이 올바른지 확인
- [ ] 재배포 완료
- [ ] 빌드 성공 확인

---

## 🆘 여전히 오류가 발생한다면

### 1. 로컬에서 환경 변수 확인

로컬 `.env.local` 파일이 있다면, Vercel에도 동일한 값이 설정되어 있는지 확인:

```bash
# 로컬에서 환경 변수 확인 (값은 표시되지 않음)
cat .env.local | grep -E "NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE|ADMIN_KEY"
```

### 2. Vercel CLI로 확인

```bash
# Vercel CLI 설치
npm i -g vercel

# 환경 변수 확인
vercel env ls
```

### 3. 빌드 로그 확인

Vercel Dashboard → Deployments → 최신 배포 → **Build Logs**에서 정확한 오류 메시지 확인

### 4. 환경 변수 재설정

모든 환경 변수를 삭제하고 다시 추가해보세요:
1. **Settings** → **Environment Variables**
2. 각 변수의 **⋯** 메뉴 → **Delete**
3. 위의 2단계부터 다시 진행

---

## 📚 추가 리소스

- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase 환경 변수 가이드](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)


