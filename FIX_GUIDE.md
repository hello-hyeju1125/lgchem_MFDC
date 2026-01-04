# 문제 해결 가이드

## 문제 상황
- 테스트 스크립트는 실행되지만 데이터가 Supabase에 저장되지 않음
- "missing required error components" HTML 응답 발생
- 여러 Next.js 프로세스가 동시에 실행 중

## 해결 방법

### 1단계: 모든 Next.js 프로세스 종료

터미널에서 다음 명령어를 실행하세요:

```bash
pkill -9 -f "next dev"
```

또는 Activity Monitor에서 "node" 프로세스를 수동으로 종료할 수 있습니다.

### 2단계: 서버 재시작

**새 터미널 창**을 열고 다음 명령어를 실행하세요:

```bash
cd /Users/hello_hyeju/Downloads/lgchem_MFDC
npm run dev
```

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000  (또는 다른 포트)
- Network:      http://192.168.x.x:3000
```

**중요**: 서버가 시작되는 포트 번호를 확인하세요!

### 3단계: 테스트 스크립트 수정 (포트 번호 확인)

`scripts/test-api.sh` 파일을 열어서 PORT 변수를 실제 실행 포트로 변경하세요.

예를 들어, 서버가 3000 포트에서 실행 중이면:
```bash
PORT=3000
```

### 4단계: 테스트 재실행

서버가 정상적으로 실행 중인 상태에서, **다른 터미널 창**에서 테스트를 실행하세요:

```bash
bash scripts/test-api.sh
```

### 5단계: 결과 확인

성공하면 다음과 같은 JSON 응답이 표시됩니다:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "leadershipType": "ICRD",
    "scores": [...],
    "submittedAt": "..."
  }
}
```

### 6단계: Supabase에서 데이터 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. Table Editor > responses 테이블 클릭
3. 데이터가 저장되었는지 확인

## 문제가 계속되면

1. **개발 서버 콘솔 확인**: 에러 메시지가 있는지 확인
2. **환경 변수 확인**: `.env.local` 파일이 올바르게 설정되었는지 확인
3. **세션 코드 확인**: Supabase에서 세션 코드가 정확한지 확인

