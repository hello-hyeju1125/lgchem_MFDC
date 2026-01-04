# 테스트 완료 후 다음 단계

테스트 스크립트가 성공적으로 실행되었다면, 이제 다음 단계를 진행하세요.

## ✅ 1단계: 데이터베이스 확인

Supabase Dashboard에서 데이터가 제대로 저장되었는지 확인합니다.

### 1-1. Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 **Table Editor** 클릭

### 1-2. responses 테이블 확인

1. **responses** 테이블 클릭
2. 데이터가 저장되었는지 확인:
   - `id`: 고유 ID
   - `session_id`: 세션 ID (sessions 테이블 참조)
   - `leadership_type`: 계산된 리더십 유형 (예: "ICRD")
   - `axis_scores`: 4축 점수 (JSON 형식)
   - `pole`: 각 축의 우세 극성 (JSON 형식)
   - `answers`: 원본 응답 데이터 (32문항, JSON 형식)
   - `created_at`: 제출 시간

3. `axis_scores`와 `pole` 컬럼을 클릭하여 JSON 데이터 확인

### 1-3. sessions 테이블 확인

1. **sessions** 테이블 클릭
2. 생성한 테스트 세션이 있는지 확인

---

## ✅ 2단계: 여러 개의 제출 테스트

집계 데이터를 확인하려면 최소 2~3개의 제출이 필요합니다.

### 2-1. 테스트 스크립트를 여러 번 실행

터미널에서 테스트 스크립트를 2~3번 더 실행하세요:

```bash
bash scripts/test-api.sh
```

각 실행마다 새로운 응답이 데이터베이스에 저장됩니다.

### 2-2. 또는 다른 유형으로 테스트

터미널에서 다음 명령어로 다른 유형(ESPE)을 제출해보세요:

```bash
curl -X POST http://localhost:3005/api/submit -H "Content-Type: application/json" -d '{"sessionCode":"test-session-001","answers":{"M1":2,"M2":1,"M3":2,"M4":1,"M5":2,"M6":1,"M7":2,"M8":1,"F9":1,"F10":2,"F11":1,"F12":2,"F13":1,"F14":2,"F15":1,"F16":2,"D17":1,"D18":2,"D19":1,"D20":2,"D21":1,"D22":2,"D23":1,"D24":2,"C25":2,"C26":1,"C27":2,"C28":1,"C29":2,"C30":1,"C31":2,"C32":1}}'
```

---

## ✅ 3단계: 집계 API 확인

여러 개의 제출을 한 후, 집계 API로 데이터를 확인합니다.

### 3-1. 브라우저에서 확인 (가장 쉬움)

브라우저 주소창에 다음 URL을 입력하세요 (포트와 세션 코드, admin_key는 실제 값으로 변경):

```
http://localhost:3005/api/admin/aggregates?session_code=test-session-001&admin_key=lgchem-leadership-admin-2026-secure
```

JSON 형식으로 집계 데이터가 표시됩니다:
- `typeDistribution`: 유형별 분포
- `axisStats`: 4축 통계
- `insights`: 디브리핑 인사이트

### 3-2. curl 명령어로 확인

```bash
curl "http://localhost:3005/api/admin/aggregates?session_code=test-session-001&admin_key=lgchem-leadership-admin-2026-secure"
```

### 3-3. 예상 결과

2~3개의 제출을 했다면 다음과 같은 결과가 나와야 합니다:

```json
{
  "success": true,
  "data": {
    "sessionCode": "test-session-001",
    "sessionTitle": "테스트 세션",
    "totalResponses": 3,
    "typeDistribution": [
      { "type": "ICRD", "count": 2, "ratio": 0.6667 },
      { "type": "ESPE", "count": 1, "ratio": 0.3333 }
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
    }
  }
}
```

---

## ✅ 4단계: RPC 함수 직접 테스트 (선택사항)

Supabase SQL Editor에서 RPC 함수를 직접 테스트할 수 있습니다.

1. Supabase Dashboard > **SQL Editor** 클릭
2. 다음 쿼리 실행:

```sql
-- 유형 분포 확인
SELECT * FROM get_type_distribution('test-session-001');

-- 축 통계 확인
SELECT * FROM get_axis_stats('test-session-001');

-- 통합 집계 확인
SELECT get_session_aggregates('test-session-001');
```

---

## ✅ 5단계: 프론트엔드 연동 (다음 작업)

백엔드 테스트가 완료되었다면, 다음 작업을 진행할 수 있습니다:

### 5-1. 프론트엔드에서 제출 API 연동

현재 프론트엔드는 localStorage만 사용하고 있지만, 백엔드 제출 API를 연동할 수 있습니다:

1. 진단 완료 시 `POST /api/submit` 호출
2. 성공 시 결과 페이지로 이동
3. (선택) 제출 후 로컬 스토리지 정리

### 5-2. 관리자 대시보드 페이지 구현

집계 API를 사용하는 관리자 대시보드 페이지를 만들 수 있습니다:

1. `/admin/dashboard` 페이지 생성
2. 세션 코드 입력 폼
3. 집계 데이터 시각화 (차트 라이브러리 사용)
4. 유형 분포 파이 차트
5. 4축 통계 바 차트

### 5-3. 실제 세션 운영

1. 실제 교육 세션 코드 생성
2. QR 코드 생성 (세션 코드 포함)
3. 참여자에게 배포
4. 디브리핑 전 집계 데이터 확인

---

## 🔍 문제 해결

### 데이터가 저장되지 않음

1. 개발 서버 콘솔에서 에러 메시지 확인
2. Supabase Dashboard > Logs에서 에러 확인
3. 환경 변수가 올바르게 설정되었는지 확인 (`.env.local`)

### 집계 API가 빈 결과 반환

- 최소 1개 이상의 제출이 필요합니다
- 세션 코드가 정확한지 확인
- `totalResponses`가 0이면 제출 데이터가 없는 것입니다

### "Session not found" 에러

SQL Editor에서 세션 코드 확인:
```sql
SELECT session_code, title FROM sessions;
```

---

## 📚 참고 자료

- `BACKEND_SETUP.md`: 백엔드 설정 및 운영 가이드
- `TEST_GUIDE.md`: 상세 테스트 방법
- `supabase/schema.sql`: 데이터베이스 스키마

---

**다음 작업을 진행할 준비가 되셨나요?** 프론트엔드 연동이나 관리자 대시보드 구현을 도와드릴 수 있습니다!

