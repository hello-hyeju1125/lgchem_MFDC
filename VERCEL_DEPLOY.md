# Vercel 배포 가이드

## 🎯 권장 방법: GitHub 연동 후 배포

### 왜 GitHub 연동을 권장하나요?

1. **자동 배포**: 코드를 푸시할 때마다 자동으로 재배포
2. **버전 관리**: 변경 이력 추적 및 롤백 가능
3. **환경 변수 안전 관리**: Vercel Dashboard에서 환경 변수를 안전하게 관리
4. **프리뷰 배포**: Pull Request마다 자동으로 프리뷰 배포 생성
5. **협업 용이**: 여러 개발자가 함께 작업 가능

---

## 📋 배포 단계별 가이드

### 1단계: GitHub 저장소 준비

```bash
# 현재 디렉토리에서 Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가 (제외 파일은 .gitignore에 설정됨)
git add .

# 첫 커밋
git commit -m "Initial commit: LG Chem MFDC Leadership Assessment"

# GitHub에 새 저장소 생성 후:
# 1. https://github.com/new 에서 새 저장소 생성
# 2. 저장소 이름 입력 (예: lgchem-mfdc)
# 3. Public 또는 Private 선택
# 4. README, .gitignore, license 추가하지 않기 (이미 있으므로)

# GitHub 저장소에 연결 및 푸시
git remote add origin https://github.com/your-username/lgchem-mfdc.git
git branch -M main
git push -u origin main
```

### 2단계: Vercel 프로젝트 생성

1. **Vercel 접속**: https://vercel.com 접속 후 로그인
2. **새 프로젝트 추가**: "Add New" → "Project" 클릭
3. **GitHub 저장소 연결**: 
   - GitHub 계정 연결 (처음이면 인증 필요)
   - 방금 푸시한 저장소 선택
4. **프로젝트 설정**:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `.next` (자동 설정됨)
   - **Install Command**: `npm install` (자동 설정됨)

### 3단계: 환경 변수 설정

**중요**: 환경 변수는 Vercel Dashboard에서 설정해야 합니다. `.env.local`은 로컬 개발용입니다.

#### Vercel Dashboard에서 환경 변수 추가하기:

1. 프로젝트 설정 화면에서 **"Environment Variables"** 섹션 찾기
2. 다음 환경 변수들을 추가 (각각 Production, Preview, Development 환경에 대해 설정):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_KEY=your-secure-admin-key-here-change-this-in-production
```

**각 환경 변수 설명:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anonymous Key (공개 가능)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (절대 노출 금지!)
- `ADMIN_KEY`: 관리자 API 접근용 키 (임의의 긴 문자열 권장)

**💡 팁**: 
- 각 변수를 추가할 때 Production, Preview, Development 환경을 모두 선택
- 값은 Supabase Dashboard > Settings > API에서 확인 가능

### 4단계: 배포 실행

환경 변수 설정 후 **"Deploy"** 버튼 클릭!

Vercel이 자동으로:
1. GitHub에서 코드 가져오기
2. 의존성 설치 (`npm install`)
3. 빌드 실행 (`npm run build`)
4. 배포 완료

### 5단계: 배포 확인

배포가 완료되면:
- Vercel이 자동으로 생성한 URL 확인 (예: `https://lgchem-mfdc.vercel.app`)
- 웹사이트 접속하여 정상 작동 확인
- Supabase 연결 확인 (데이터 제출 테스트)

---

## 🔄 이후 업데이트 방법

### 자동 배포 (GitHub 연동)

```bash
# 코드 변경 후
git add .
git commit -m "Update: 변경 사항 설명"
git push origin main
```

→ Vercel이 자동으로 새 배포 생성!

### 수동 배포 (Vercel CLI)

만약 GitHub 연동 없이 직접 배포하고 싶다면:

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

**주의**: 수동 배포는 환경 변수를 매번 다시 설정해야 할 수 있습니다.

---

## ⚙️ 빌드 설정 확인

프로젝트의 `package.json`에 다음 빌드 스크립트가 있는지 확인:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

✅ 현재 프로젝트에는 이미 설정되어 있습니다!

---

## 🔧 문제 해결

### 빌드 오류 발생 시

1. **로컬에서 빌드 테스트**:
   ```bash
   npm run build
   ```
   로컬에서 빌드가 성공해야 Vercel에서도 성공합니다.

2. **환경 변수 확인**:
   - Vercel Dashboard에서 모든 환경 변수가 올바르게 설정되었는지 확인
   - 변수 이름에 오타가 없는지 확인

3. **Supabase 연결 확인**:
   - Supabase 프로젝트가 활성화되어 있는지 확인
   - URL과 키가 올바른지 확인

### 환경 변수 관련 오류

- `Missing NEXT_PUBLIC_SUPABASE_URL`: Vercel Dashboard에서 환경 변수 추가 확인
- `Missing SUPABASE_SERVICE_ROLE_KEY`: 서버 사이드 환경 변수 설정 확인

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] GitHub 저장소에 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 및 GitHub 연결 완료
- [ ] 모든 환경 변수 설정 완료 (4개 변수)
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인 (✅ 확인됨)
- [ ] Supabase 프로젝트 활성화 확인
- [ ] 배포 후 웹사이트 동작 테스트

---

## 🚀 커스텀 도메인 설정 (선택사항)

1. Vercel Dashboard > 프로젝트 > Settings > Domains
2. 원하는 도메인 추가
3. DNS 설정 가이드 따라하기

---

## 📚 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 환경 변수 설정](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)

