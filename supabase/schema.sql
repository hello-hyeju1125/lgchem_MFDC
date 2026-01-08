-- ============================================
-- 리더십 진단 시스템 데이터베이스 스키마
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하거나
-- 마이그레이션 도구를 통해 적용할 수 있습니다.
-- ============================================

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 교육 차수(Session) 테이블
-- 각 교육 프로그램 또는 디브리핑 세션을 나타냄
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,  -- QR 코드에 포함될 식별자 (예: "2024-01-15-morning")
  title TEXT,  -- 교육 제목 (선택사항)
  starts_at TIMESTAMPTZ,  -- 교육 시작 시간 (선택사항)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 참여자 응답(Response) 테이블
-- 각 참여자의 진단 제출 결과를 저장
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 참여자 기본 정보
  participant_name TEXT,   -- 이름
  participant_email TEXT,  -- 이메일 주소
  
  -- 계산된 결과
  leadership_type TEXT NOT NULL,  -- 16유형 코드 (예: "ICRD", "ESPN" 등)
  axis_scores JSONB NOT NULL,  -- 4축 점수: { motivation: { intrinsic: 5.2, extrinsic: 4.8 }, ... }
  pole JSONB NOT NULL,  -- 각 축의 우세 극성: { motivation: "intrinsic", flexibility: "change", ... }
  
  -- 원본 데이터 (관리자 화면에 노출하지 않음, 데이터 무결성/검증용)
  answers JSONB NOT NULL,  -- 32문항 원점수: { "M1": 6, "M2": 5, ... }
  
  -- 중복 방지/재응답 정책용 (선택사항)
  client_hash TEXT  -- 클라이언트 식별 해시 (중복 제출 방지용)
);

-- 문항 매핑(Question Map) 테이블
-- 채점 계산의 핵심: 각 문항이 어느 축/극성에 속하는지 정의
CREATE TABLE IF NOT EXISTS question_map (
  id INTEGER PRIMARY KEY,  -- 1~32 (문항 번호)
  question_id TEXT UNIQUE NOT NULL,  -- "M1", "M2", ..., "C32" (문항 ID)
  axis TEXT NOT NULL CHECK (axis IN ('motivation', 'flexibility', 'direction', 'communication')),
  pole TEXT NOT NULL,  -- 'intrinsic', 'extrinsic', 'change', 'system', 'work', 'people', 'direct', 'engage'
  reverse_scored BOOLEAN DEFAULT FALSE,  -- 역채점 필요 시 true (현재 로직에서는 사용 안 함)
  weight NUMERIC DEFAULT 1.0,  -- 가중치 (기본 1.0)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================

-- sessions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_session_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- responses 테이블 인덱스 (집계 쿼리 성능 향상)
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_leadership_type ON responses(leadership_type);
CREATE INDEX IF NOT EXISTS idx_responses_session_leadership_type ON responses(session_id, leadership_type);  -- 집계 쿼리 최적화

-- question_map 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_question_map_axis ON question_map(axis);
CREATE INDEX IF NOT EXISTS idx_question_map_pole ON question_map(pole);

-- ============================================
-- 3. RLS (Row Level Security) 활성화
-- ============================================

-- RLS 활성화
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS 정책 정의
-- ============================================

-- sessions 테이블 정책
-- - anonymous: SELECT 허용 (세션 코드로 세션 조회 필요)
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- 세션 코드로 조회 가능 (공개 정보)

-- responses 테이블 정책
-- - anonymous: INSERT만 허용 (제출용)
-- - SELECT는 기본적으로 차단 (RPC 함수를 통해서만 집계 결과 조회)
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);  -- 익명 사용자도 제출 가능

DROP POLICY IF EXISTS "responses_select_policy" ON responses;
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  USING (false);  -- RPC 함수에서만 접근 (개인 정보 보호)

-- question_map 테이블 정책
-- - SELECT만 허용 (채점 로직에서 사용)
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- 읽기 전용, 모든 사용자 접근 가능

-- ============================================
-- 5. 집계용 RPC 함수
-- ============================================

-- 유형 분포 집계 함수
-- session_code를 받아 leadership_type별 count와 ratio를 반환
CREATE OR REPLACE FUNCTION get_type_distribution(p_session_code TEXT)
RETURNS TABLE (
  type TEXT,
  count BIGINT,
  ratio NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- 함수 실행 시 정의자의 권한으로 실행 (RLS 우회)
AS $$
DECLARE
  v_session_id UUID;
  v_total_count BIGINT;
BEGIN
  -- session_code로 session_id 조회
  SELECT id INTO v_session_id
  FROM sessions
  WHERE session_code = p_session_code;
  
  -- 세션이 존재하지 않으면 에러
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_code;
  END IF;
  
  -- 전체 응답 수 계산
  SELECT COUNT(*) INTO v_total_count
  FROM responses
  WHERE session_id = v_session_id;
  
  -- 전체 응답이 없으면 빈 결과 반환
  IF v_total_count = 0 THEN
    RETURN;
  END IF;
  
  -- 유형별 집계
  RETURN QUERY
  SELECT 
    r.leadership_type::TEXT AS type,
    COUNT(*)::BIGINT AS count,
    ROUND((COUNT(*)::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4) AS ratio
  FROM responses r
  WHERE r.session_id = v_session_id
  GROUP BY r.leadership_type
  ORDER BY count DESC, type;
END;
$$;

-- 4축 통계 집계 함수
-- session_code를 받아 각 축의 평균, 표준편차, 우세 극성 비율을 반환
CREATE OR REPLACE FUNCTION get_axis_stats(p_session_code TEXT)
RETURNS TABLE (
  axis TEXT,
  pole_distribution JSONB,
  mean_score NUMERIC,
  stddev_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_total_count BIGINT;
BEGIN
  -- session_code로 session_id 조회
  SELECT id INTO v_session_id
  FROM sessions
  WHERE session_code = p_session_code;
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_code;
  END IF;
  
  SELECT COUNT(*) INTO v_total_count
  FROM responses
  WHERE session_id = v_session_id;
  
  IF v_total_count = 0 THEN
    RETURN;
  END IF;
  
  -- 각 축별로 집계
  -- pole 컬럼과 axis_scores 컬럼을 모두 사용
  RETURN QUERY
  WITH axis_data AS (
    SELECT 
      r.id,
      (r.pole->>'motivation')::TEXT AS motivation_pole,
      (r.axis_scores->'motivation'->>'intrinsic')::NUMERIC AS motivation_intrinsic,
      (r.axis_scores->'motivation'->>'extrinsic')::NUMERIC AS motivation_extrinsic,
      (r.pole->>'flexibility')::TEXT AS flexibility_pole,
      (r.axis_scores->'flexibility'->>'change')::NUMERIC AS flexibility_change,
      (r.axis_scores->'flexibility'->>'system')::NUMERIC AS flexibility_system,
      (r.pole->>'direction')::TEXT AS direction_pole,
      (r.axis_scores->'direction'->>'work')::NUMERIC AS direction_work,
      (r.axis_scores->'direction'->>'people')::NUMERIC AS direction_people,
      (r.pole->>'communication')::TEXT AS communication_pole,
      (r.axis_scores->'communication'->>'direct')::NUMERIC AS communication_direct,
      (r.axis_scores->'communication'->>'engage')::NUMERIC AS communication_engage
    FROM responses r
    WHERE r.session_id = v_session_id
  )
  SELECT 
    'motivation'::TEXT AS axis,
    jsonb_build_object(
      'intrinsic', ROUND((COUNT(*) FILTER (WHERE motivation_pole = 'intrinsic')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'extrinsic', ROUND((COUNT(*) FILTER (WHERE motivation_pole = 'extrinsic')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'balanced', ROUND((COUNT(*) FILTER (WHERE motivation_pole = 'balanced')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4)
    ) AS pole_distribution,
    ROUND(AVG(motivation_intrinsic + motivation_extrinsic)::NUMERIC, 2) AS mean_score,
    ROUND(STDDEV(motivation_intrinsic + motivation_extrinsic)::NUMERIC, 2) AS stddev_score
  FROM axis_data
  UNION ALL
  SELECT 
    'flexibility'::TEXT AS axis,
    jsonb_build_object(
      'change', ROUND((COUNT(*) FILTER (WHERE flexibility_pole = 'change')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'system', ROUND((COUNT(*) FILTER (WHERE flexibility_pole = 'system')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'balanced', ROUND((COUNT(*) FILTER (WHERE flexibility_pole = 'balanced')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4)
    ) AS pole_distribution,
    ROUND(AVG(flexibility_change + flexibility_system)::NUMERIC, 2) AS mean_score,
    ROUND(STDDEV(flexibility_change + flexibility_system)::NUMERIC, 2) AS stddev_score
  FROM axis_data
  UNION ALL
  SELECT 
    'direction'::TEXT AS axis,
    jsonb_build_object(
      'work', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'work')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'people', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'people')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'balanced', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'balanced')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4)
    ) AS pole_distribution,
    ROUND(AVG(direction_work + direction_people)::NUMERIC, 2) AS mean_score,
    ROUND(STDDEV(direction_work + direction_people)::NUMERIC, 2) AS stddev_score
  FROM axis_data
  UNION ALL
  SELECT 
    'communication'::TEXT AS axis,
    jsonb_build_object(
      'direct', ROUND((COUNT(*) FILTER (WHERE communication_pole = 'direct')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'engage', ROUND((COUNT(*) FILTER (WHERE communication_pole = 'engage')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'balanced', ROUND((COUNT(*) FILTER (WHERE communication_pole = 'balanced')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4)
    ) AS pole_distribution,
    ROUND(AVG(communication_direct + communication_engage)::NUMERIC, 2) AS mean_score,
    ROUND(STDDEV(communication_direct + communication_engage)::NUMERIC, 2) AS stddev_score
  FROM axis_data;
END;
$$;

-- 통합 집계 함수 (모든 집계 데이터를 한번에 반환)
CREATE OR REPLACE FUNCTION get_session_aggregates(p_session_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_session_title TEXT;
  v_session_starts_at TIMESTAMPTZ;
  v_total_count BIGINT;
  v_type_distribution JSONB;
  v_axis_stats JSONB;
  v_result JSONB;
BEGIN
  -- 세션 정보 조회
  SELECT id, title, starts_at INTO v_session_id, v_session_title, v_session_starts_at
  FROM sessions
  WHERE session_code = p_session_code;
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_code;
  END IF;
  
  -- 전체 응답 수
  SELECT COUNT(*) INTO v_total_count
  FROM responses
  WHERE session_id = v_session_id;
  
  -- 유형 분포 (배열 형태로 변환)
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', type,
      'count', count,
      'ratio', ratio
    ) ORDER BY count DESC, type
  ) INTO v_type_distribution
  FROM get_type_distribution(p_session_code);
  
  -- 축 통계 (배열 형태로 변환)
  SELECT jsonb_agg(
    jsonb_build_object(
      'axis', axis,
      'poleDistribution', pole_distribution,
      'meanScore', mean_score,
      'stddevScore', stddev_score
    )
  ) INTO v_axis_stats
  FROM get_axis_stats(p_session_code);
  
  -- 결과 조합
  v_result := jsonb_build_object(
    'sessionCode', p_session_code,
    'sessionTitle', v_session_title,
    'sessionStartsAt', v_session_starts_at,
    'totalResponses', v_total_count,
    'typeDistribution', COALESCE(v_type_distribution, '[]'::jsonb),
    'axisStats', COALESCE(v_axis_stats, '[]'::jsonb),
    'generatedAt', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- ============================================
-- 6. 초기 데이터 삽입 (question_map)
-- ============================================
-- 주의: 실제 문항 매핑은 questions.json과 scoring.ts 로직에 맞춰 조정 필요

-- question_map 데이터 삽입 (기존 데이터가 있으면 스킵)
-- 현재 questions.json의 구조에 맞춰 삽입
-- 실제 운영 시에는 questions.json과 동기화 필요

INSERT INTO question_map (id, question_id, axis, pole, reverse_scored, weight)
VALUES
  -- Motivation 축 (M1-M8: 모두 Intrinsic)
  (1, 'M1', 'motivation', 'intrinsic', false, 1.0),
  (2, 'M2', 'motivation', 'intrinsic', false, 1.0),
  (3, 'M3', 'motivation', 'intrinsic', false, 1.0),
  (4, 'M4', 'motivation', 'intrinsic', false, 1.0),
  (5, 'M5', 'motivation', 'intrinsic', false, 1.0),
  (6, 'M6', 'motivation', 'intrinsic', false, 1.0),
  (7, 'M7', 'motivation', 'intrinsic', false, 1.0),
  (8, 'M8', 'motivation', 'intrinsic', false, 1.0),
  
  -- Flexibility 축 (F9-F16: 모두 Change)
  (9, 'F9', 'flexibility', 'change', false, 1.0),
  (10, 'F10', 'flexibility', 'change', false, 1.0),
  (11, 'F11', 'flexibility', 'change', false, 1.0),
  (12, 'F12', 'flexibility', 'change', false, 1.0),
  (13, 'F13', 'flexibility', 'change', false, 1.0),
  (14, 'F14', 'flexibility', 'change', false, 1.0),
  (15, 'F15', 'flexibility', 'change', false, 1.0),
  (16, 'F16', 'flexibility', 'change', false, 1.0),
  
  -- Direction 축 (D17-D24: 모두 Work)
  (17, 'D17', 'direction', 'work', false, 1.0),
  (18, 'D18', 'direction', 'results', false, 1.0),
  (19, 'D19', 'direction', 'results', false, 1.0),
  (20, 'D20', 'direction', 'results', false, 1.0),
  (21, 'D21', 'direction', 'results', false, 1.0),
  (22, 'D22', 'direction', 'results', false, 1.0),
  (23, 'D23', 'direction', 'results', false, 1.0),
  (24, 'D24', 'direction', 'results', false, 1.0),
  
  -- Communication 축 (C25-C32: 모두 Direct)
  (25, 'C25', 'communication', 'direct', false, 1.0),
  (26, 'C26', 'communication', 'direct', false, 1.0),
  (27, 'C27', 'communication', 'direct', false, 1.0),
  (28, 'C28', 'communication', 'direct', false, 1.0),
  (29, 'C29', 'communication', 'direct', false, 1.0),
  (30, 'C30', 'communication', 'direct', false, 1.0),
  (31, 'C31', 'communication', 'direct', false, 1.0),
  (32, 'C32', 'communication', 'direct', false, 1.0)
ON CONFLICT (id) DO NOTHING;  -- 이미 있으면 스킵

-- ============================================
-- 7. 유용한 뷰 생성 (선택사항)
-- ============================================

-- 세션별 응답 요약 뷰 (디버깅/운영용)
CREATE OR REPLACE VIEW session_summary AS
SELECT 
  s.session_code,
  s.title,
  s.starts_at,
  COUNT(r.id) AS response_count,
  COUNT(DISTINCT r.leadership_type) AS unique_types,
  MIN(r.created_at) AS first_response_at,
  MAX(r.created_at) AS last_response_at
FROM sessions s
LEFT JOIN responses r ON s.id = r.session_id
GROUP BY s.id, s.session_code, s.title, s.starts_at;

-- ============================================
-- 완료 메시지
-- ============================================
-- 이 스키마를 실행한 후:
-- 1. Supabase Dashboard에서 RLS가 활성화되었는지 확인
-- 2. question_map 데이터가 올바르게 삽입되었는지 확인
-- 3. RPC 함수들이 정상적으로 생성되었는지 테스트
-- 4. 환경 변수 설정 (.env.local 파일에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 추가)

