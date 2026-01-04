-- ============================================
-- 리더십 진단 시스템 - 빠른 설정 SQL
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하세요.
-- 전체 스키마를 처음부터 다시 설정합니다.
-- ============================================

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 교육 차수(Session) 테이블
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  title TEXT,
  starts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 참여자 응답(Response) 테이블
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  leadership_type TEXT NOT NULL,
  axis_scores JSONB NOT NULL,
  pole JSONB NOT NULL,
  answers JSONB NOT NULL,
  client_hash TEXT
);

-- 문항 매핑(Question Map) 테이블
CREATE TABLE IF NOT EXISTS question_map (
  id INTEGER PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  axis TEXT NOT NULL CHECK (axis IN ('motivation', 'flexibility', 'direction', 'communication')),
  pole TEXT NOT NULL,
  reverse_scored BOOLEAN DEFAULT FALSE,
  weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_session_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_leadership_type ON responses(leadership_type);
CREATE INDEX IF NOT EXISTS idx_responses_session_leadership_type ON responses(session_id, leadership_type);
CREATE INDEX IF NOT EXISTS idx_question_map_axis ON question_map(axis);
CREATE INDEX IF NOT EXISTS idx_question_map_pole ON question_map(pole);

-- ============================================
-- 3. RLS 활성화
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_map ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS 정책 정의
-- ============================================

-- sessions 테이블 정책 (SELECT 허용)
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
CREATE POLICY "sessions_select_policy" ON sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- responses 테이블 정책
DROP POLICY IF EXISTS "responses_insert_policy" ON responses;
CREATE POLICY "responses_insert_policy" ON responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "responses_select_policy" ON responses;
CREATE POLICY "responses_select_policy" ON responses
  FOR SELECT
  USING (false);

-- question_map 테이블 정책
DROP POLICY IF EXISTS "question_map_select_policy" ON question_map;
CREATE POLICY "question_map_select_policy" ON question_map
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================
-- 5. RPC 함수
-- ============================================

-- 유형 분포 집계 함수
CREATE OR REPLACE FUNCTION get_type_distribution(p_session_code TEXT)
RETURNS TABLE (
  type TEXT,
  count BIGINT,
  ratio NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_total_count BIGINT;
BEGIN
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
      (r.axis_scores->'direction'->>'results')::NUMERIC AS direction_results,
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
      'results', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'results')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'people', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'people')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4),
      'balanced', ROUND((COUNT(*) FILTER (WHERE direction_pole = 'balanced')::NUMERIC / v_total_count::NUMERIC)::NUMERIC, 4)
    ) AS pole_distribution,
    ROUND(AVG(direction_results + direction_people)::NUMERIC, 2) AS mean_score,
    ROUND(STDDEV(direction_results + direction_people)::NUMERIC, 2) AS stddev_score
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

-- 통합 집계 함수
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
  SELECT id, title, starts_at INTO v_session_id, v_session_title, v_session_starts_at
  FROM sessions
  WHERE session_code = p_session_code;
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_code;
  END IF;
  
  SELECT COUNT(*) INTO v_total_count
  FROM responses
  WHERE session_id = v_session_id;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', type,
      'count', count,
      'ratio', ratio
    ) ORDER BY count DESC, type
  ) INTO v_type_distribution
  FROM get_type_distribution(p_session_code);
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'axis', axis,
      'poleDistribution', pole_distribution,
      'meanScore', mean_score,
      'stddevScore', stddev_score
    )
  ) INTO v_axis_stats
  FROM get_axis_stats(p_session_code);
  
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
-- 6. 초기 데이터 삽입
-- ============================================

-- question_map 데이터 삽입
INSERT INTO question_map (id, question_id, axis, pole, reverse_scored, weight)
VALUES
  (1, 'M1', 'motivation', 'intrinsic', false, 1.0),
  (2, 'M2', 'motivation', 'intrinsic', false, 1.0),
  (3, 'M3', 'motivation', 'intrinsic', false, 1.0),
  (4, 'M4', 'motivation', 'intrinsic', false, 1.0),
  (5, 'M5', 'motivation', 'intrinsic', false, 1.0),
  (6, 'M6', 'motivation', 'intrinsic', false, 1.0),
  (7, 'M7', 'motivation', 'intrinsic', false, 1.0),
  (8, 'M8', 'motivation', 'intrinsic', false, 1.0),
  (9, 'F9', 'flexibility', 'change', false, 1.0),
  (10, 'F10', 'flexibility', 'change', false, 1.0),
  (11, 'F11', 'flexibility', 'change', false, 1.0),
  (12, 'F12', 'flexibility', 'change', false, 1.0),
  (13, 'F13', 'flexibility', 'change', false, 1.0),
  (14, 'F14', 'flexibility', 'change', false, 1.0),
  (15, 'F15', 'flexibility', 'change', false, 1.0),
  (16, 'F16', 'flexibility', 'change', false, 1.0),
  (17, 'D17', 'direction', 'results', false, 1.0),
  (18, 'D18', 'direction', 'results', false, 1.0),
  (19, 'D19', 'direction', 'results', false, 1.0),
  (20, 'D20', 'direction', 'results', false, 1.0),
  (21, 'D21', 'direction', 'results', false, 1.0),
  (22, 'D22', 'direction', 'results', false, 1.0),
  (23, 'D23', 'direction', 'results', false, 1.0),
  (24, 'D24', 'direction', 'results', false, 1.0),
  (25, 'C25', 'communication', 'direct', false, 1.0),
  (26, 'C26', 'communication', 'direct', false, 1.0),
  (27, 'C27', 'communication', 'direct', false, 1.0),
  (28, 'C28', 'communication', 'direct', false, 1.0),
  (29, 'C29', 'communication', 'direct', false, 1.0),
  (30, 'C30', 'communication', 'direct', false, 1.0),
  (31, 'C31', 'communication', 'direct', false, 1.0),
  (32, 'C32', 'communication', 'direct', false, 1.0)
ON CONFLICT (id) DO NOTHING;

-- 테스트 세션 생성
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW())
ON CONFLICT (session_code) DO NOTHING
RETURNING id, session_code, title;

-- ============================================
-- 완료 메시지
-- ============================================
SELECT '✅ 스키마 설정 완료!' AS status;

