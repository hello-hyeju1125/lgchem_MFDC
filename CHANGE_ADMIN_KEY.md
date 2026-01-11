# ADMIN_KEY 변경 가이드

ADMIN_KEY는 관리자 대시보드 접근에 사용되는 보안 키입니다. 변경 방법은 다음과 같습니다.

## 📝 변경 위치

ADMIN_KEY는 **두 곳**에서 설정해야 합니다:

1. **로컬 개발 환경** (`.env.local` 파일)
2. **Vercel 프로덕션 환경** (Vercel Dashboard)

---

## 1️⃣ 로컬 개발 환경에서 변경

### 단계별 가이드

1. **`.env.local` 파일 열기**
   - 프로젝트 루트 디렉토리의 `.env.local` 파일을 엽니다.

2. **ADMIN_KEY 값 변경**
   - 21번째 줄의 `ADMIN_KEY` 값을 원하는 새 키로 변경합니다.
   
   ```env
   # 변경 전
   ADMIN_KEY=lgchem-leadership-admin-2026-secure
   
   # 변경 후 (예시)
   ADMIN_KEY=your-new-secure-admin-key-2026
   ```

3. **서버 재시작**
   - 개발 서버가 실행 중이면 **중지(Ctrl+C) 후 다시 시작**해야 합니다.
   ```bash
   npm run dev
   ```

4. **대시보드에서 확인**
   - 변경한 ADMIN_KEY로 대시보드에 접속하여 정상 작동하는지 확인합니다.

---

## 2️⃣ Vercel 프로덕션 환경에서 변경

### 단계별 가이드

1. **Vercel Dashboard 접속**
   - https://vercel.com 접속 후 로그인
   - 배포된 프로젝트 선택

2. **Environment Variables 메뉴로 이동**
   - **Settings** 탭 클릭
   - 왼쪽 메뉴에서 **Environment Variables** 클릭

3. **기존 ADMIN_KEY 찾기**
   - `ADMIN_KEY` 변수를 찾습니다
   - 오른쪽의 **⋯** (점 3개) 메뉴 클릭

4. **값 수정 또는 삭제 후 재추가**
   
   **방법 A: 수정**
   - **Edit** 클릭
   - **Value** 입력란에 새로운 ADMIN_KEY 입력
   - **Environment** 선택 (Production, Preview, Development)
   - **Save** 클릭

   **방법 B: 삭제 후 재추가** (권장)
   - **Delete** 클릭하여 기존 값 삭제
   - **Add New** 버튼 클릭
   - **Key**: `ADMIN_KEY` 입력
   - **Value**: 새로운 ADMIN_KEY 입력
   - **Environment**: Production, Preview, Development 모두 선택
   - **Save** 클릭

5. **재배포**
   - 환경 변수 변경 후 **반드시 재배포**해야 합니다.
   - **Deployments** 탭으로 이동
   - 최신 배포의 **⋯** 메뉴 → **Redeploy** 선택
   - 또는 GitHub에 새 커밋을 푸시하면 자동 재배포됩니다

---

## 🔑 ADMIN_KEY 생성 가이드

### 권장 사항

- **길이**: 최소 20자 이상 권장
- **복잡도**: 영문, 숫자, 하이픈(-), 언더스코어(_) 조합
- **예측 불가능**: 추측하기 어려운 랜덤한 문자열

### 예시

```
# 좋은 예시
lgchem-admin-2026-secure-key-abc123xyz
my-super-secret-admin-key-2026-12-25
admin-key-lgchem-leadership-2026-xyz789

# 나쁜 예시 (너무 짧거나 예측 가능)
admin123
lgchem2026
password
```

### 온라인 생성기 사용

- UUID 생성기: https://www.uuidgenerator.net/
- 생성된 UUID를 그대로 사용하거나, 원하는 형식으로 조합

---

## ⚠️ 주의사항

1. **로컬과 Vercel 값 일치**
   - 로컬과 Vercel의 ADMIN_KEY를 **같은 값**으로 설정하는 것을 권장합니다.
   - 다르게 설정하면 로컬에서 테스트한 키로 Vercel에 접속할 수 없습니다.

2. **보안**
   - ADMIN_KEY는 **절대 공개 저장소(GitHub)에 커밋하지 마세요**.
   - `.env.local` 파일은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

3. **변경 후 확인**
   - ADMIN_KEY 변경 후 반드시 대시보드 접속 테스트를 진행하세요.
   - 기존 키로는 접속이 불가능하며, 새 키로만 접속 가능합니다.

4. **서버 재시작 필요**
   - 로컬 개발 환경: `.env.local` 변경 후 개발 서버 재시작 필수
   - Vercel 프로덕션: 환경 변수 변경 후 재배포 필수

---

## 🔍 변경 확인 방법

### 로컬 환경

```bash
# 개발 서버 재시작 후
# 브라우저에서 http://localhost:3000/dashboard 접속
# 변경한 ADMIN_KEY로 로그인 테스트
```

### Vercel 환경

1. Vercel Dashboard → Settings → Environment Variables
2. `ADMIN_KEY` 변수가 새 값으로 표시되는지 확인
3. 배포 완료 후 프로덕션 URL에서 테스트

---

## ❓ 문제 해결

### "유효하지 않은 관리자 키입니다" 오류

- 입력한 ADMIN_KEY가 환경 변수와 일치하는지 확인
- 서버 재시작(로컬) 또는 재배포(Vercel)가 완료되었는지 확인

### 변경 사항이 적용되지 않음

- **로컬**: 개발 서버를 완전히 중지 후 재시작
- **Vercel**: 재배포가 완료되었는지 확인 (Deployments 탭)

### 환경 변수를 찾을 수 없음

- Vercel Dashboard → Settings → Environment Variables
- 변수 이름이 정확히 `ADMIN_KEY`인지 확인 (대소문자 구분)
- Production 환경에 체크되어 있는지 확인

