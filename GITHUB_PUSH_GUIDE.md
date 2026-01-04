# GitHub 푸시 가이드

## 🚀 빠른 해결 방법

### 옵션 1: 터미널에서 직접 실행 (가장 간단)

터미널에서 다음 명령어를 실행하세요:

```bash
cd /Users/hello_hyeju/Downloads/lgchem_MFDC
git push -u origin main
```

GitHub 계정과 비밀번호(또는 Personal Access Token)를 입력하세요.

---

### 옵션 2: Personal Access Token 사용

1. **GitHub에서 Personal Access Token 생성:**
   - https://github.com/settings/tokens 접속
   - "Generate new token" → "Generate new token (classic)" 클릭
   - Token 이름 입력 (예: "lgchem-mfdc")
   - Expiration 설정 (원하는 기간 선택)
   - 권한 선택: `repo` 체크박스 선택 (전체 권한)
   - "Generate token" 클릭
   - **중요**: 생성된 토큰을 복사해두세요! (다시 볼 수 없습니다)

2. **토큰으로 푸시:**
   ```bash
   cd /Users/hello_hyeju/Downloads/lgchem_MFDC
   git push -u origin main
   ```
   - Username: `hello-hyeju1125`
   - Password: **Personal Access Token** 붙여넣기

---

### 옵션 3: SSH 키 사용 (더 안전하고 편리)

1. **SSH 키 생성 (이미 있다면 생략):**
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```

2. **SSH 키를 GitHub에 등록:**
   ```bash
   # 공개 키 복사
   cat ~/.ssh/id_ed25519.pub
   ```
   - https://github.com/settings/ssh/new 접속
   - 복사한 키를 붙여넣고 저장

3. **원격 저장소 URL을 SSH로 변경:**
   ```bash
   git remote set-url origin git@github.com:hello-hyeju1125/lgchem_MFDC.git
   git push -u origin main
   ```

---

### 옵션 4: GitHub Desktop 사용

1. GitHub Desktop 앱 설치: https://desktop.github.com/
2. GitHub Desktop에서 저장소 열기
3. "Push origin" 버튼 클릭

---

## ✅ 확인 방법

푸시가 성공했다면:
- https://github.com/hello-hyeju1125/lgchem_MFDC 접속
- 파일들이 업데이트되었는지 확인
- Vercel이 자동으로 재배포를 시작합니다! (연결되어 있다면)

---

## 🎉 자동 배포 확인

Vercel Dashboard에서:
1. 프로젝트 페이지 열기
2. "Deployments" 탭 확인
3. 새 배포가 시작되었는지 확인

코드가 성공적으로 푸시되면 Vercel이 자동으로 빌드하고 배포합니다!

