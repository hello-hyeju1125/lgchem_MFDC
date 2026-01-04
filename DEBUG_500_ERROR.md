# HTTP 500 에러 디버깅 가이드

## 확인 사항

### 1. 개발 서버 콘솔 확인

개발 서버를 실행한 터미널에서 에러 메시지를 확인하세요.

서버가 실행 중인 터미널에서 다음과 같은 에러 메시지가 표시될 것입니다:
- `응답 저장 실패: ...`
- `세션 조회 에러: ...`
- `제출 API 에러: ...`

### 2. API 응답 확인

터미널에서 다음 명령어로 자세한 에러를 확인하세요:

```bash
curl -s -X POST http://localhost:3006/api/submit \
  -H "Content-Type: application/json" \
  -d '{"sessionCode":"test-session-001","answers":{"M1":6,"M2":5,"M3":7,"M4":6,"M5":5,"M6":6,"M7":7,"M8":6,"F9":5,"F10":6,"F11":5,"F12":6,"F13":5,"F14":6,"F15":5,"F16":6,"D17":7,"D18":6,"D19":7,"D20":6,"D21":7,"D22":6,"D23":7,"D24":6,"C25":6,"C26":7,"C27":6,"C28":7,"C29":6,"C30":7,"C31":6,"C32":7}}' | python3 -m json.tool
```

`details` 필드에 실제 에러 메시지가 있을 것입니다.

### 3. Supabase 로그 확인

Supabase Dashboard > Logs > API Logs에서 에러를 확인하세요.

## 일반적인 원인

### RLS 정책 문제
- `responses` 테이블의 INSERT 정책이 없거나 잘못 설정됨
- 해결: `QUICK_SETUP.sql` 또는 `supabase/schema.sql`을 다시 실행

### 세션 없음
- `test-session-001` 세션이 데이터베이스에 없음
- 해결: Supabase SQL Editor에서 세션 생성

### 환경 변수 문제
- `.env.local` 파일의 환경 변수가 잘못되었거나 누락됨
- 해결: 환경 변수 재확인

## 다음 단계

1. 개발 서버 콘솔의 에러 메시지를 확인하세요
2. 위 명령어로 API 응답의 `details`를 확인하세요
3. 에러 메시지를 알려주시면 정확한 해결 방법을 제시하겠습니다

