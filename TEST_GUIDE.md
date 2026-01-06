# 백엔드 API 테스트 가이드

이 가이드는 백엔드 API를 테스트하는 방법을 단계별로 설명합니다.

## 사전 준비

✅ Supabase SQL 스키마 실행 완료
✅ 테스트 세션 생성 완료
✅ 환경 변수 설정 완료 (`.env.local`)

## 1단계: 개발 서버 실행

터미널에서 다음 명령어를 실행합니다:

```bash
npm run dev
```

서버가 실행되면 터미널에 다음과 같은 메시지가 표시됩니다:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

**주의:** 포트 3000이 이미 사용 중이면 Next.js가 자동으로 다른 포트(예: 3001, 3005 등)를 사용합니다.
터미널에 표시된 실제 포트 번호를 확인하고, 아래의 테스트 예시에서 포트 번호를 해당 포트로 변경하세요.

예: `http://localhost:3000` → `http://localhost:3005`

## 2단계: 제출 API 테스트

### 방법 0: 테스트 스크립트 사용 (가장 쉬움) ⭐

터미널에서 다음 명령어 한 줄만 실행하면 됩니다:

```bash
bash scripts/test-api.sh
```

또는:

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

이 스크립트는 제출 API와 집계 API를 자동으로 테스트합니다.
포트 번호나 세션 코드를 변경하려면 `scripts/test-api.sh` 파일을 열어서 상단의 설정을 수정하세요.

---

### 방법 1: curl 명령어 사용 (터미널)

**⚠️ 주의:** curl 명령어는 백슬래시(`\`)를 포함하여 여러 줄로 나뉘어 있는데, 
실제로는 **한 줄로 붙여넣거나**, 터미널에서 백슬래시 뒤에 Enter를 눌러 다음 줄로 이어가면 됩니다.

**더 쉬운 방법: 한 줄 버전 사용**

**기본 테스트 (ICRD 유형) - 한 줄 버전:**

터미널에 이 한 줄을 그대로 복사해서 붙여넣으세요:

```bash
curl -X POST http://localhost:3005/api/submit -H "Content-Type: application/json" -d '{"sessionCode":"test-session-001","answers":{"M1":6,"M2":5,"M3":7,"M4":6,"M5":5,"M6":6,"M7":7,"M8":6,"F9":5,"F10":6,"F11":5,"F12":6,"F13":5,"F14":6,"F15":5,"F16":6,"D17":7,"D18":6,"D19":7,"D20":6,"D21":7,"D22":6,"D23":7,"D24":6,"C25":6,"C26":7,"C27":6,"C28":7,"C29":6,"C30":7,"C31":6,"C32":7}}'
```

**참고:** 포트 번호(3005)와 세션 코드(test-session-001)를 실제 값으로 변경하세요.

**다른 유형 테스트 (ESPN 유형 - 반대 극성) - 한 줄 버전:**

```bash
curl -X POST http://localhost:3005/api/submit -H "Content-Type: application/json" -d '{"sessionCode":"test-session-001","answers":{"M1":2,"M2":1,"M3":2,"M4":1,"M5":2,"M6":1,"M7":2,"M8":1,"F9":1,"F10":2,"F11":1,"F12":2,"F13":1,"F14":2,"F15":1,"F16":2,"D17":1,"D18":2,"D19":1,"D20":2,"D21":1,"D22":2,"D23":1,"D24":2,"C25":2,"C26":1,"C27":2,"C28":1,"C29":2,"C30":1,"C31":2,"C32":1}}'
```

**동점 테스트 (X 포함) - 한 줄 버전:**

```bash
curl -X POST http://localhost:3005/api/submit -H "Content-Type: application/json" -d '{"sessionCode":"test-session-001","answers":{"M1":4,"M2":4,"M3":4,"M4":4,"M5":4,"M6":4,"M7":4,"M8":4,"F9":6,"F10":6,"F11":6,"F12":6,"F13":6,"F14":6,"F15":6,"F16":6,"D17":6,"D18":6,"D19":6,"D20":6,"D21":6,"D22":6,"D23":6,"D24":6,"C25":6,"C26":6,"C27":6,"C28":6,"C29":6,"C30":6,"C31":6,"C32":6}}'
```

### 방법 2: 브라우저 개발자 도구 사용

1. 브라우저에서 개발자 도구(F12) 열기
2. Console 탭에서 다음 코드 실행:

```javascript
// 포트 번호를 실제 실행 포트로 변경하세요 (예: 3005)
fetch('http://localhost:3005/api/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionCode: 'test-session-001',
    answers: {
      M1: 6, M2: 5, M3: 7, M4: 6,
      M5: 5, M6: 6, M7: 7, M8: 6,
      F9: 5, F10: 6, F11: 5, F12: 6,
      F13: 5, F14: 6, F15: 5, F16: 6,
      D17: 7, D18: 6, D19: 7, D20: 6,
      D21: 7, D22: 6, D23: 7, D24: 6,
      C25: 6, C26: 7, C27: 6, C28: 7,
      C29: 6, C30: 7, C31: 6, C32: 7
    }
  })
})
  .then(res => res.json())
  .then(data => console.log('✅ 성공:', data))
  .catch(err => console.error('❌ 에러:', err));
```

### 예상 응답 (성공 시)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "leadershipType": "ICRD",
    "scores": [
      {
        "axis": "Motivation",
        "dimension1": "Intrinsic",
        "dimension2": "Extrinsic",
        "score1": 6.0,
        "score2": 2.0,
        "dominant": "Intrinsic"
      },
      {
        "axis": "Flexibility",
        "dimension1": "Change",
        "dimension2": "System",
        "score1": 5.5,
        "score2": 2.5,
        "dominant": "Change"
      },
      {
        "axis": "Direction",
        "dimension1": "Results",
        "dimension2": "People",
        "score1": 6.5,
        "score2": 1.5,
        "dominant": "Results"
      },
      {
        "axis": "Communication",
        "dimension1": "Direct",
        "dimension2": "eNgage",
        "score1": 6.25,
        "score2": 1.75,
        "dominant": "Direct"
      }
    ],
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 3단계: 데이터베이스 확인

Supabase Dashboard > Table Editor에서 확인:

1. **responses 테이블** 확인
   - 제출한 데이터가 저장되었는지 확인
   - `leadership_type`, `axis_scores`, `pole` 컬럼 확인

2. **sessions 테이블** 확인
   - 세션 정보 확인

## 4단계: 관리자 집계 API 테스트

여러 개의 제출을 한 후 집계 API를 테스트합니다.

### curl 명령어 (한 줄)

```bash
curl "http://localhost:3005/api/admin/aggregates?session_code=test-session-001&admin_key=lgchem-leadership-admin-2026-secure"
```

이 명령어는 이미 한 줄이므로 그대로 복사해서 붙여넣으면 됩니다.

**주의:** `.env.local`에 설정한 `ADMIN_KEY` 값을 사용하세요.

### 브라우저에서 테스트

브라우저 주소창에 입력 (포트 번호를 실제 실행 포트로 변경):
```
http://localhost:3005/api/admin/aggregates?session_code=test-session-001&admin_key=lgchem-leadership-admin-2026-secure
```

### 예상 응답

```json
{
  "success": true,
  "data": {
    "sessionCode": "test-session-001",
    "sessionTitle": "테스트 세션",
    "totalResponses": 3,
    "typeDistribution": [
      {
        "type": "ICRD",
        "count": 2,
        "ratio": 0.6667
      },
      {
        "type": "ESPN",
        "count": 1,
        "ratio": 0.3333
      }
    ],
    "axisStats": [
      {
        "axis": "motivation",
        "poleDistribution": {
          "intrinsic": 0.6667,
          "extrinsic": 0.3333,
          "balanced": 0.0
        },
        "meanScore": 8.0,
        "stddevScore": 2.0
      },
      ...
    ],
    "insights": {
      "highVarianceAxes": [...],
      "skewedAxes": [...]
    },
    "generatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

## 5단계: RPC 함수 직접 테스트 (선택사항)

Supabase SQL Editor에서 직접 RPC 함수를 테스트할 수 있습니다:

```sql
-- 유형 분포만 조회
SELECT * FROM get_type_distribution('test-session-001');

-- 축 통계만 조회
SELECT * FROM get_axis_stats('test-session-001');

-- 통합 집계 조회
SELECT * FROM get_session_aggregates('test-session-001');
```

## 문제 해결

### "Session not found" 에러

세션 코드를 확인하세요:
```sql
SELECT session_code, title FROM sessions;
```

### "유효하지 않은 관리자 키" 에러

`.env.local` 파일의 `ADMIN_KEY` 값이 정확한지 확인하세요.

### "RLS policy violation" 에러

SQL 스키마가 제대로 실행되었는지 확인하세요. Supabase Dashboard > SQL Editor에서 스키마를 다시 실행해보세요.

### 데이터가 저장되지 않음

1. 개발 서버 콘솔에서 에러 메시지 확인
2. Supabase Dashboard > Logs에서 에러 확인
3. 환경 변수가 올바르게 설정되었는지 확인

## 다음 단계

✅ API 테스트 완료 후:
1. 프론트엔드에서 제출 API 연동
2. 관리자 대시보드 페이지 구현 (집계 API 사용)
3. 실제 세션 코드 생성 및 배포

