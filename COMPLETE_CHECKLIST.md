# 전체 시스템 점검 체크리스트

문제가 발생했을 때 이 체크리스트를 따라 하나씩 확인하세요.

## ✅ 1단계: 환경 설정 확인

### 1-1. 의존성 설치
```bash
npm install
```

확인: `node_modules` 폴더가 존재하는지, `@supabase/supabase-js`와 `zod`가 설치되었는지

### 1-2. 환경 변수 설정
`.env.local` 파일이 프로젝트 루트에 있는지 확인:

```bash
cat .env.local
```

다음 변수들이 모두 설정되어 있어야 합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_KEY`

### 1-3. 코드 컴파일 확인
```bash
npm run build
```

에러가 없어야 합니다. 에러가 있으면 수정하세요.

---

## ✅ 2단계: 데이터베이스 설정 확인

### 2-1. Supabase SQL 스키마 실행
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. SQL Editor 열기
3. `supabase/schema.sql` 파일의 전체 내용 실행
4. 에러가 없이 완료되었는지 확인

### 2-2. 테이블 확인
Supabase Dashboard > Table Editor에서 다음 테이블이 있는지 확인:
- `sessions`
- `responses`
- `question_map`

### 2-3. 테스트 세션 생성
SQL Editor에서 실행:
```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
RETURNING id, session_code;
```

결과가 나와야 합니다.

### 2-4. RLS 정책 확인
Supabase Dashboard > Authentication > Policies에서:
- `responses` 테이블에 INSERT 정책이 있는지 확인
- `sessions` 테이블이 있는지 확인

---

## ✅ 3단계: 서버 실행 확인

### 3-1. 기존 프로세스 종료
```bash
pkill -9 -f "next dev"
```

### 3-2. 서버 시작
```bash
npm run dev
```

**중요**: 서버가 시작되는 포트 번호를 확인하세요!
예: `- Local: http://localhost:3000`

### 3-3. 서버 실행 상태 확인
브라우저에서 `http://localhost:3000` (또는 실행 포트) 접속
- 메인 페이지가 보여야 합니다
- 에러가 없어야 합니다

---

## ✅ 4단계: API 테스트

### 4-1. 간단한 테스트 (권장)
```bash
bash scripts/test-simple.sh 3000
```
(포트 번호를 실제 실행 포트로 변경)

### 4-2. 전체 테스트
```bash
bash scripts/test-api.sh
```
(포트 번호 확인 필요: `scripts/test-api.sh` 파일에서 PORT 변수 수정)

### 4-3. 수동 테스트
```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"sessionCode":"test-session-001","answers":{"M1":6,"M2":5,"M3":7,"M4":6,"M5":5,"M6":6,"M7":7,"M8":6,"F9":5,"F10":6,"F11":5,"F12":6,"F13":5,"F14":6,"F15":5,"F16":6,"D17":7,"D18":6,"D19":7,"D20":6,"D21":7,"D22":6,"D23":7,"D24":6,"C25":6,"C26":7,"C27":6,"C28":7,"C29":6,"C30":7,"C31":6,"C32":7}}'
```

**예상 응답:**
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

---

## ✅ 5단계: 데이터 확인

### 5-1. Supabase에서 확인
1. Supabase Dashboard > Table Editor
2. `responses` 테이블 클릭
3. 데이터가 저장되었는지 확인

### 5-2. 집계 API 테스트
```bash
curl "http://localhost:3000/api/admin/aggregates?session_code=test-session-001&admin_key=lgchem-leadership-admin-2026-secure"
```

---

## 🔍 문제 해결

### 문제: "Session not found" 에러
**원인**: 세션이 데이터베이스에 없음
**해결**: SQL Editor에서 세션 생성

### 문제: "RLS policy violation" 에러
**원인**: RLS 정책이 잘못 설정됨
**해결**: `supabase/schema.sql`의 RLS 정책 부분을 다시 실행

### 문제: "404 Not Found" 에러
**원인**: 서버가 실행되지 않았거나 API 라우트가 인식되지 않음
**해결**: 
1. 서버 재시작 (`npm run dev`)
2. 포트 번호 확인
3. API 파일이 `app/api/submit/route.ts`에 있는지 확인

### 문제: 데이터가 저장되지 않음
**원인**: 
- RLS 정책 문제
- 세션 조회 실패
- 환경 변수 문제
**해결**: 
1. Supabase Dashboard > Logs에서 에러 확인
2. 개발 서버 콘솔에서 에러 확인
3. 환경 변수 재확인

### 문제: 서버가 시작되지 않음
**원인**: 포트가 이미 사용 중
**해결**:
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 [PID]
```

---

## 📝 최종 체크리스트

- [ ] 의존성 설치 완료
- [ ] 환경 변수 설정 완료
- [ ] 코드 컴파일 성공
- [ ] 데이터베이스 스키마 실행 완료
- [ ] 테스트 세션 생성 완료
- [ ] 서버 정상 실행
- [ ] API 테스트 성공
- [ ] 데이터베이스에 데이터 저장 확인
- [ ] 집계 API 정상 작동 확인

---

모든 항목을 확인했는데도 문제가 있으면, 다음 정보를 포함하여 알려주세요:
1. 에러 메시지 (전체)
2. 개발 서버 콘솔 출력
3. Supabase Dashboard > Logs의 에러
4. 실행한 명령어와 결과

