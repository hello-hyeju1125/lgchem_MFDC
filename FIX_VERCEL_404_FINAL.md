# Vercel 404 NOT_FOUND 에러 최종 해결 가이드

## 🔍 404 에러 발생 시 확인사항

404 NOT_FOUND 에러가 발생하는 경우 다음을 순서대로 확인하세요.

## ✅ 1단계: Vercel Dashboard 설정 확인

### 가장 중요한 설정: Root Directory

1. **Vercel Dashboard 접속**
   - 프로젝트 선택 → **Settings** → **General**

2. **Root Directory 확인**
   - **비어있어야 합니다!** (`.` 또는 아무것도 없어야 함)
   - 서브디렉토리가 설정되어 있으면 **반드시 제거**

3. **Framework Preset 확인**
   - **Next.js**로 설정되어 있어야 함

4. **Build & Development Settings 확인**
   - Build Command: `npm run build` (또는 비워두기 - 자동 감지)
   - Output Directory: `.next` (또는 비워두기 - 자동 감지)
   - Install Command: `npm install` (또는 비워두기 - 자동 감지)

## ✅ 2단계: 배포 로그 확인

1. **Vercel Dashboard** → **Deployments** 탭
2. 최신 배포 클릭
3. **Build Logs** 확인

### 빌드 성공 여부 확인

빌드가 성공했다면:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
```

빌드가 실패했다면 에러 메시지를 확인하고 수정해야 합니다.

## ✅ 3단계: 배포된 URL 확인

1. **Vercel Dashboard** → **Deployments** 탭
2. 최신 배포의 **URL** 클릭 (예: `https://lgchem-mfdc.vercel.app`)
3. 루트 경로(`/`)로 접근 확인

**주의**: 
- `/vercel` 같은 경로가 아니라 루트 URL 그대로 접근
- 예: `https://lgchem-mfdc.vercel.app` (O)
- 예: `https://lgchem-mfdc.vercel.app/deployment/xxx` (X)

## ✅ 4단계: GitHub 저장소 구조 확인

GitHub에서 확인:
- `package.json`이 **루트 디렉토리**에 있는지
- `next.config.js`가 **루트 디렉토리**에 있는지
- `app/` 폴더가 **루트 디렉토리**에 있는지

올바른 구조:
```
lgchem_MFDC/          ← 저장소 루트
├── package.json      ← 여기!
├── next.config.js    ← 여기!
├── app/              ← 여기!
├── components/
└── ...
```

## ✅ 5단계: 수동 재배포

모든 설정을 확인한 후:

1. **Vercel Dashboard** → **Deployments**
2. 최신 배포의 **"..."** 메뉴 클릭
3. **"Redeploy"** 선택
4. 또는 코드를 다시 푸시:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

## 🔧 추가 해결 방법

### 방법 1: 프로젝트 재연결

1. Vercel Dashboard → Settings → Git
2. "Disconnect" 클릭
3. 다시 "Connect Git Repository" 클릭
4. 같은 저장소 선택
5. 설정 확인 후 배포

### 방법 2: vercel.json 추가 (이미 추가됨)

프로젝트 루트에 `vercel.json` 파일이 있습니다:
```json
{
  "framework": "nextjs"
}
```

이 파일이 있으면 Vercel이 Next.js로 인식합니다.

### 방법 3: 환경 변수 확인

환경 변수가 누락되어 빌드는 성공하지만 런타임에서 에러가 발생할 수 있습니다.

**필수 환경 변수:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_KEY`

Vercel Dashboard → Settings → Environment Variables에서 확인

## 📋 체크리스트

배포 전 확인:
- [ ] GitHub 저장소 루트에 `package.json` 존재
- [ ] Vercel Root Directory가 **비어있음** (가장 중요!)
- [ ] Framework Preset이 **Next.js**로 설정
- [ ] 빌드가 성공했는지 확인
- [ ] 환경 변수가 모두 설정되어 있음
- [ ] 올바른 URL로 접근하고 있음

## 🚨 여전히 문제가 있다면

### 에러 메시지에 따라:

**"Build failed"**
→ 빌드 로그를 확인하고 에러 메시지에 따라 수정

**"404 on specific route"**
→ 해당 페이지 파일이 존재하는지 확인

**"404 on all routes"**
→ Root Directory 설정 문제일 가능성이 매우 높음!

### Vercel 지원팀에 문의

위 방법들을 모두 시도했는데도 문제가 있다면:
1. Vercel Dashboard → Help → Contact Support
2. 다음 정보 포함:
   - 프로젝트 이름
   - 배포 URL
   - 에러 메시지 스크린샷
   - 빌드 로그

## 💡 가장 흔한 원인 (90%)

**Root Directory 설정이 잘못되었거나 서브디렉토리로 설정되어 있는 경우**

해결: Vercel Dashboard → Settings → General → Root Directory를 **비워두기**

