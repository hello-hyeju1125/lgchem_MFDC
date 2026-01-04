# GitHub에 코드 업데이트하는 방법

## 🚀 빠른 업데이트 가이드

### 1단계: Git 초기화 및 파일 추가

터미널에서 다음 명령어를 실행하세요:

```bash
# 프로젝트 디렉토리로 이동 (이미 있다면 생략)
cd /Users/hello_hyeju/Downloads/lgchem_MFDC

# Git 저장소 초기화
git init

# 모든 파일 추가 (.gitignore에 따라 제외 파일은 자동 제외됨)
git add .

# 첫 커밋 또는 변경사항 커밋
git commit -m "Fix: Vercel 배포 빌드 에러 수정"
```

### 2단계: GitHub 저장소 연결

#### 옵션 A: 이미 GitHub 저장소가 있는 경우

```bash
# 기존 GitHub 저장소 URL 확인 (Vercel Dashboard에서 확인 가능)
# 예: https://github.com/your-username/lgchem-mfdc.git

# 원격 저장소 연결
git remote add origin https://github.com/your-username/your-repo-name.git

# 기본 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

#### 옵션 B: 새 GitHub 저장소를 만들어야 하는 경우

1. **GitHub에서 새 저장소 생성:**
   - https://github.com/new 접속
   - Repository name 입력 (예: `lgchem-mfdc`)
   - Public 또는 Private 선택
   - **중요**: README, .gitignore, license 추가하지 않기 (이미 있으므로)
   - "Create repository" 클릭

2. **생성된 저장소 URL 복사**

3. **터미널에서 연결:**
   ```bash
   git remote add origin https://github.com/your-username/lgchem-mfdc.git
   git branch -M main
   git push -u origin main
   ```

### 3단계: 업데이트 확인

GitHub 저장소 페이지에서 파일들이 올라갔는지 확인하세요!

---

## 📝 이후 업데이트하는 방법

코드를 수정한 후에는 다음 명령어로 업데이트할 수 있습니다:

```bash
# 변경된 파일 확인
git status

# 모든 변경사항 추가
git add .

# 커밋 (변경사항을 설명하는 메시지 작성)
git commit -m "변경사항 설명 예: Fix: 버그 수정"

# GitHub에 푸시
git push origin main
```

**중요**: Vercel이 GitHub과 연결되어 있으면, `git push`만 하면 자동으로 재배포됩니다! 🎉

---

## 🔍 Vercel과 연결 확인

1. Vercel Dashboard 접속
2. 프로젝트 선택
3. Settings > Git 확인
4. GitHub 저장소가 연결되어 있는지 확인

만약 연결되어 있다면, 코드를 푸시할 때마다 자동으로 배포됩니다!

---

## ⚠️ 문제 해결

### "remote origin already exists" 에러

```bash
# 기존 remote 확인
git remote -v

# 기존 remote 제거 후 다시 추가
git remote remove origin
git remote add origin https://github.com/your-username/your-repo.git
```

### "authentication failed" 에러

GitHub 인증이 필요합니다:
- Personal Access Token 사용
- 또는 GitHub Desktop 앱 사용

### 파일이 푸시되지 않음

`.gitignore` 파일을 확인하세요:
```bash
# .gitignore 확인
cat .gitignore
```

`.env.local` 같은 파일은 보안상 GitHub에 올라가지 않습니다 (정상입니다).

