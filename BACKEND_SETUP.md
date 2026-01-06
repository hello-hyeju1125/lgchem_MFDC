# 리더십 진단 시스템 백엔드 설정 가이드

이 문서는 리더십 진단 시스템의 백엔드를 설정하고 운영하는 방법을 설명합니다.

## 목차

1. [환경 설정](#환경-설정)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [API 사용법](#api-사용법)
4. [운영 가이드](#운영-가이드)
5. [문제 해결](#문제-해결)

---

## 환경 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인하여 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL
   - API Keys (anon key, service_role key)

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력합니다:

```bash
# .env.local 파일 내용
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_KEY=your-secure-admin-key
```

**보안 주의사항:**
- `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- `SUPABASE_SERVICE_ROLE_KEY`와 `ADMIN_KEY`는 절대 클라이언트 사이드 코드나 공개 저장소에 노출하지 마세요.
- Vercel 배포 시 Environment Variables에서 설정해야 합니다.

### 3. 의존성 설치

```bash
npm install
```

---

## 데이터베이스 설정

### 1. SQL 스키마 실행

1. Supabase Dashboard > SQL Editor로 이동합니다.
2. `supabase/schema.sql` 파일의 전체 내용을 복사하여 SQL Editor에 붙여넣습니다.
3. "Run" 버튼을 클릭하여 실행합니다.
4. 성공 메시지가 표시되면 테이블, 인덱스, RLS 정책, RPC 함수가 생성됩니다.

### 2. 스키마 확인

SQL Editor에서 다음 쿼리로 테이블 생성 여부를 확인합니다:

```sql
-- 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'responses', 'question_map');

-- question_map 데이터 확인
SELECT * FROM question_map ORDER BY id;

-- RPC 함수 확인
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%';
```

### 3. 테스트 세션 생성

SQL Editor에서 테스트용 세션을 생성합니다:

```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
RETURNING id, session_code;
```

---

## API 사용법

### 1. 제출 API (POST /api/submit)

참여자가 진단 결과를 제출합니다.

**요청:**
```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "test-session-001",
    "answers": {
      "M1": 6, "M2": 5, "M3": 7, "M4": 6,
      "M5": 5, "M6": 6, "M7": 7, "M8": 6,
      "F9": 5, "F10": 6, "F11": 5, "F12": 6,
      "F13": 5, "F14": 6, "F15": 5, "F16": 6,
      "D17": 7, "D18": 6, "D19": 7, "D20": 6,
      "D21": 7, "D22": 6, "D23": 7, "D24": 6,
      "C25": 6, "C26": 7, "C27": 6, "C28": 7,
      "C29": 6, "C30": 7, "C31": 6, "C32": 7
    }
  }'
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
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
      ...
    ],
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. 관리자 집계 API (GET /api/admin/aggregates)

관리자가 세션별 집계 데이터를 조회합니다.

**요청:**
```bash
curl "http://localhost:3000/api/admin/aggregates?session_code=test-session-001&admin_key=your-secure-admin-key"
```

**응답:**
```json
{
  "success": true,
  "data": {
    "sessionCode": "test-session-001",
    "sessionTitle": "테스트 세션",
    "totalResponses": 25,
    "typeDistribution": [
      { "type": "ICRD", "count": 12, "ratio": 0.48 },
      { "type": "ECPN", "count": 8, "ratio": 0.32 },
      ...
    ],
    "axisStats": [
      {
        "axis": "motivation",
        "poleDistribution": {
          "intrinsic": 0.6,
          "extrinsic": 0.35,
          "balanced": 0.05
        },
        "meanScore": 6.2,
        "stddevScore": 1.5
      },
      ...
    ],
    "insights": {
      "highVarianceAxes": [
        { "axis": "flexibility", "stddev": 2.1 }
      ],
      "skewedAxes": [
        { "axis": "communication", "dominantPole": "direct", "poleRatio": 0.85 }
      ]
    }
  }
}
```

---

## 운영 가이드

### 1. 세션 코드 생성 및 운영

#### 세션 코드 생성

각 교육 프로그램 또는 디브리핑 세션마다 고유한 `session_code`를 생성합니다.

**권장 형식:**
- 날짜-시간: `2024-01-15-morning`
- 교육명-일자: `leadership-2024-01-15`
- 고유 ID: `session-abc123`

**SQL로 세션 생성:**
```sql
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('2024-01-15-morning', '2024년 1월 15일 오전 세션', '2024-01-15 09:00:00+09')
RETURNING id, session_code;
```

#### 세션 코드 배포

- QR 코드에 포함하여 참여자에게 제공
- URL에 포함: `https://your-domain.com?session=2024-01-15-morning`
- 프론트엔드에서 세션 코드를 자동으로 감지하거나 입력받도록 구현

### 2. 문항 매핑 수정 (question_map)

문항 매핑을 수정해야 하는 경우:

1. **영향 범위 확인:**
   - `question_map` 테이블의 변경은 새로운 제출부터 적용됩니다.
   - 기존 응답 데이터에는 영향이 없습니다 (이미 계산되어 저장됨).

2. **수정 방법:**
```sql
-- 예: M1 문항의 pole을 'extrinsic'으로 변경
UPDATE question_map
SET pole = 'extrinsic'
WHERE question_id = 'M1';

-- 가중치 변경
UPDATE question_map
SET weight = 1.5
WHERE question_id = 'M1';
```

3. **주의사항:**
   - `scoring.ts`의 로직과 일관성을 유지해야 합니다.
   - 변경 후 테스트 제출을 통해 결과를 검증하세요.

### 3. 개인정보/익명성 보호

#### 데이터 보호 원칙

1. **개인 정보 수집 금지:**
   - 이름, 이메일, 전화번호 등 개인 식별 정보는 수집하지 않습니다.
   - `client_hash`는 선택사항이며, 중복 제출 방지용입니다 (개인 식별 불가).

2. **관리자 접근 제한:**
   - 관리자 집계 API는 `answers` 원본 데이터를 반환하지 않습니다.
   - 집계 데이터만 제공하여 개별 응답을 추론하기 어렵게 합니다.

3. **RLS 정책:**
   - `responses` 테이블의 SELECT는 RLS로 차단되어 있습니다.
   - RPC 함수(SECURITY DEFINER)를 통해서만 집계 데이터에 접근 가능합니다.

#### 데이터 삭제

특정 세션의 데이터를 삭제해야 하는 경우:

```sql
-- 세션과 연결된 모든 응답 삭제 (CASCADE)
DELETE FROM sessions WHERE session_code = 'session-code-to-delete';

-- 또는 특정 응답만 삭제
DELETE FROM responses WHERE id = 'response-uuid';
```

### 4. 디브리핑 준비

디브리핑 전에 다음 정보를 확인합니다:

1. **집계 데이터 조회:**
   - 관리자 집계 API로 유형 분포와 축 통계를 확인합니다.
   - `insights`를 활용하여 디브리핑 포인트를 선정합니다.

2. **데이터 시각화:**
   - 유형 분포: 파이 차트 또는 막대 그래프
   - 축 통계: 평균/표준편차를 표시하는 차트
   - 우세 극성 비율: 스택 바 차트

3. **디브리핑 전략:**
   - 편차가 큰 축: 다양한 의견이 공존하는 영역으로 토론 유도
   - 치우친 축: 강점과 약점을 균형 있게 다루기

---

## 문제 해결

### 1. "Session not found" 에러

**원인:** 세션 코드가 존재하지 않거나 오타

**해결:**
```sql
-- 세션 코드 확인
SELECT session_code, title FROM sessions;

-- 세션 생성
INSERT INTO sessions (session_code, title) VALUES ('your-session-code', 'Title');
```

### 2. "RLS policy violation" 에러

**원인:** RLS 정책이 제대로 설정되지 않음

**해결:**
```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sessions', 'responses', 'question_map');

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'responses';
```

### 3. "Function get_session_aggregates does not exist" 에러

**원인:** RPC 함수가 생성되지 않음

**해결:**
- `supabase/schema.sql` 파일의 RPC 함수 부분을 다시 실행합니다.
- SQL Editor에서 함수 생성 부분만 선택하여 실행합니다.

### 4. 점수 계산 불일치

**원인:** `question_map` 데이터와 `scoring.ts` 로직 불일치

**해결:**
- `question_map` 테이블의 데이터와 `data/questions.json` 파일을 비교합니다.
- `scoring.ts`의 `AXIS_CONFIG`와 일치하는지 확인합니다.

### 5. 환경 변수 에러

**원인:** 환경 변수가 설정되지 않음

**해결:**
- `.env.local` 파일이 프로젝트 루트에 있는지 확인합니다.
- 환경 변수 이름이 정확한지 확인합니다 (대소문자 구분).
- 개발 서버를 재시작합니다 (`npm run dev`).

---

## 추가 참고사항

### 성능 최적화

- 인덱스가 올바르게 생성되었는지 확인:
  ```sql
  SELECT indexname, tablename 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  ```

### 백업

- 정기적으로 데이터베이스 백업을 수행합니다 (Supabase Dashboard > Settings > Database).
- 중요한 세션 데이터는 CSV로 내보내기:
  ```sql
  -- 세션별 집계 데이터 내보내기
  SELECT * FROM get_session_aggregates('session-code');
  ```

### 모니터링

- Supabase Dashboard > Logs에서 API 호출과 에러를 모니터링합니다.
- 응답 수가 많은 세션은 성능에 영향을 줄 수 있으니 주의합니다.

---

문의사항이 있으면 개발팀에 연락하세요.

