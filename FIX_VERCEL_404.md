# Vercel 404 NOT_FOUND 에러 해결 가이드

## 🔍 문제 확인

404 NOT_FOUND 에러는 Vercel이 프로젝트를 찾지 못할 때 발생합니다.

## ✅ 해결 방법

### 1단계: GitHub 저장소 확인

GitHub 저장소에 `package.json`이 실제로 올라갔는지 확인하세요.

**확인 방법:**
1. GitHub 저장소 페이지로 이동
2. 루트 디렉토리에서 `package.json` 파일이 보이는지 확인
3. `next.config.js`, `tsconfig.json` 등도 함께 있는지 확인

**만약 없다면:**
```bash
# 로컬에서 Git 상태 확인
git status

# package.json이 추적되고 있는지 확인
git ls-files | grep package.json

# 없다면 추가
git add package.json
git commit -m "Add package.json"
git push origin main
```

### 2단계: Vercel 프로젝트 설정 확인

**Vercel Dashboard에서 확인:**

1. 프로젝트 설정으로 이동: `프로젝트 > Settings > General`
2. **Root Directory** 설정 확인:
   - **비어있어야 합니다** (`.` 또는 빈 값)
   - 서브디렉토리 경로가 설정되어 있으면 안 됩니다
3. **Build Command** 확인: `npm run build` (기본값)
4. **Output Directory** 확인: `.next` (기본값, 또는 비워두기)
5. **Install Command** 확인: `npm install` (기본값)

**중요:** Root Directory가 잘못 설정되어 있으면 404 에러가 발생합니다!

### 3단계: Framework Preset 확인

1. Vercel Dashboard > Settings > General
2. **Framework Preset**이 **Next.js**로 설정되어 있는지 확인
3. 만약 "Other" 또는 다른 것으로 설정되어 있다면:
   - "Override" 버튼 클릭
   - Framework Preset을 **Next.js**로 변경
   - Build Command: `npm run build`
   - Output Directory: `.next` (또는 비워두기)

### 4단계: GitHub 저장소 구조 확인

**올바른 구조:**
```
lgchem-mfdc/  (저장소 루트)
├── package.json     ← 반드시 루트에 있어야 함!
├── next.config.js
├── tsconfig.json
├── app/
├── components/
├── lib/
└── ...
```

**잘못된 구조:**
```
lgchem-mfdc/  (저장소 루트)
├── some-folder/
│   ├── package.json  ← 이렇게 서브디렉토리에 있으면 안 됨!
│   └── ...
```

만약 서브디렉토리에 있다면, Vercel의 Root Directory를 해당 경로로 설정하거나 파일을 루트로 이동해야 합니다.

### 5단계: 수동으로 재배포

설정을 변경했다면:

1. Vercel Dashboard > Deployments
2. 최신 배포 옆의 "..." 메뉴 클릭
3. **"Redeploy"** 선택
4. 또는 코드를 다시 푸시:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

## 🔧 추가 진단 방법

### GitHub에서 직접 확인

브라우저에서 GitHub 저장소 URL로 이동:
```
https://github.com/your-username/lgchem-mfdc/blob/main/package.json
```

이 URL이 404를 반환하면 파일이 푸시되지 않은 것입니다.

### 로컬에서 빌드 테스트

배포 전에 로컬에서 빌드가 성공하는지 확인:
```bash
npm install
npm run build
```

빌드가 실패하면 Vercel에서도 실패합니다.

## 📋 체크리스트

- [ ] GitHub 저장소 루트에 `package.json` 존재 확인
- [ ] `next.config.js`, `tsconfig.json`도 루트에 있는지 확인
- [ ] Vercel의 Root Directory가 비어있거나 `.`인지 확인
- [ ] Framework Preset이 Next.js로 설정되어 있는지 확인
- [ ] Build Command가 `npm run build`인지 확인
- [ ] 환경 변수가 모두 설정되어 있는지 확인
- [ ] 로컬에서 `npm run build` 성공 확인

## 🚨 여전히 문제가 있다면

1. **Vercel Dashboard > Deployments**에서 빌드 로그 확인
   - 빌드 로그에 어떤 에러가 있는지 확인
   - "Build Logs" 클릭하여 상세 내용 확인

2. **프로젝트를 완전히 삭제하고 다시 생성**
   - Vercel Dashboard > Settings > General > Delete Project
   - 새로 프로젝트 생성
   - GitHub 저장소 다시 연결

3. **Vercel CLI로 로컬에서 배포 테스트**
   ```bash
   npm i -g vercel
   vercel
   ```
   이렇게 하면 배포 전에 문제를 발견할 수 있습니다.

## 💡 가장 흔한 원인

**Root Directory 설정 문제**가 가장 흔한 원인입니다!

Vercel Dashboard에서:
- Settings > General
- Root Directory를 **비워두거나** `.`로 설정
- 서브디렉토리 경로를 설정하지 마세요

