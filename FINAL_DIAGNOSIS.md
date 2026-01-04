# 최종 진단 및 해결 가이드

## 현재 상황 요약

✅ **확인 완료:**
- API 키 형식: JWT 형식 (`eyJ...`) - 올바름
- JWT 파싱: 정상 (`role: "anon"`)
- API 요청: Supabase에 도달함

❌ **문제:**
- `PostgREST; error=42501` - 권한 부족
- HTTP 401 Unauthorized

**결론: RLS 정책 문제입니다.**

## 해결 절차

### 1단계: 현재 정책 상태 확인

Supabase Dashboard > SQL Editor에서 다음 쿼리를 실행합니다:

```sql
-- supabase/diagnose-rls-issue.sql 파일의 내용
-- 또는 직접 실행:

SELECT 
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN cmd = 'INSERT' AND with_check = 'true' AND roles::text LIKE '%anon%' 
    THEN '✅ 올바름'
    ELSE '❌ 문제'
  END as status
FROM pg_policies
WHERE tablename = 'responses' AND cmd = 'INSERT';
```

**예상 결과:**
- `status`가 `✅ 올바름`이어야 합니다
- 만약 `❌ 문제`가 나오면 → 2단계로 진행

### 2단계: RLS 정책 완전 재생성

Supabase SQL Editor에서 다음 스크립트를 실행합니다:

1. `supabase/final-rls-fix.sql` 파일을 열기
2. 전체 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭

이 스크립트는:
- 모든 기존 정책 삭제
- RLS 활성화 확인
- 올바른 정책 재생성
- 자동 검증 실행

### 3단계: 정책 검증

스크립트 실행 후, 다음 쿼리로 확인:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  roles::text,
  with_check,
  CASE 
    WHEN tablename = 'responses' AND cmd = 'INSERT' 
      AND with_check = 'true' 
      AND roles::text LIKE '%anon%'
    THEN '✅ OK'
    ELSE '⚠️ CHECK'
  END as status
FROM pg_policies
WHERE tablename = 'responses'
ORDER BY cmd, policyname;
```

**필수 확인 사항:**
- `responses_insert_policy` 존재
- `cmd` = `INSERT`
- `with_check` = `true` (NULL이면 안 됨!)
- `roles`에 `anon` 포함
- `status` = `✅ OK`

### 4단계: Next.js 서버 재시작

RLS 정책 변경 후 반드시 서버를 재시작합니다:

```bash
# 현재 실행 중인 서버 중지 (Ctrl+C 또는 Cmd+C)
# 서버 재시작
npm run dev
```

### 5단계: 테스트

새 터미널에서:

```bash
bash scripts/test-simple.sh 3000
```

또는 직접 curl:

```bash
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "test-session-001",
    "answers": {
      "1": 4, "2": 4, "3": 4, "4": 4,
      "5": 4, "6": 4, "7": 4, "8": 4,
      "9": 4, "10": 4, "11": 4, "12": 4,
      "13": 4, "14": 4, "15": 4, "16": 4,
      "17": 4, "18": 4, "19": 4, "20": 4,
      "21": 4, "22": 4, "23": 4, "24": 4,
      "25": 4, "26": 4, "27": 4, "28": 4,
      "29": 4, "30": 4, "31": 4, "32": 4
    }
  }'
```

## 문제가 계속되면

### 대안 A: RLS 완전 비활성화 테스트 (격리)

문제를 격리하기 위해 임시로 RLS를 비활성화:

```sql
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
```

테스트 후 다시 활성화:

```sql
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
```

### 대안 B: Service Role Key로 테스트 (임시)

`app/api/submit/route.ts`에서 임시로 `supabaseAdmin` 사용:

```typescript
// 91번째 줄 변경:
// const { data: response, error: insertError } = await supabaseAnonymous
const { data: response, error: insertError } = await supabaseAdmin
  .from('responses')
  .insert({...})
```

이것이 작동하면 → RLS 정책 문제
이것도 실패하면 → 다른 문제 (테이블 구조, 데이터 타입 등)

**주의:** 테스트 후 원래대로 되돌리세요!

## 체크리스트

- [ ] `diagnose-rls-issue.sql` 실행하여 현재 상태 확인
- [ ] `final-rls-fix.sql` 실행하여 정책 재생성
- [ ] 검증 쿼리로 정책 확인 (`with_check = true`, `anon` 포함)
- [ ] Next.js 서버 재시작
- [ ] 테스트 실행
- [ ] 여전히 실패하면 RLS 비활성화 테스트
- [ ] Service Role Key로 테스트 (필요시)

## 중요 참고사항

1. **WITH CHECK (true)가 핵심**: INSERT 정책에 `WITH CHECK (true)`가 없으면 INSERT가 실패합니다.

2. **정책 적용 시점**: 정책을 변경한 후 Supabase가 즉시 적용하지만, Next.js 서버는 재시작하는 것이 안전합니다.

3. **역할 확인**: 정책의 `roles`에 `anon`이 포함되어야 합니다.

4. **권한 충돌**: 여러 정책이 충돌할 수 있으므로, 모든 기존 정책을 삭제하고 재생성하는 것이 가장 안전합니다.

## 파일 위치

- **진단 스크립트**: `supabase/diagnose-rls-issue.sql`
- **수정 스크립트**: `supabase/final-rls-fix.sql`
- **이 가이드**: `FINAL_DIAGNOSIS.md`

