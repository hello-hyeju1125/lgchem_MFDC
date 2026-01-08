-- ============================================
-- test-session-001에 가상 데이터 50개 삽입
-- 다양한 유형이 보이도록 분포
-- ============================================

-- 1. test-session-001 세션이 없으면 생성
INSERT INTO sessions (session_code, title, starts_at)
VALUES ('test-session-001', '테스트 세션', NOW() - INTERVAL '7 days')
ON CONFLICT (session_code) DO NOTHING;

-- 2. 세션 ID 가져오기
DO $$
DECLARE
  v_session_id UUID;
  v_leadership_types TEXT[] := ARRAY[
    'ICRD', 'ICRN', 'ICPD', 'ICPN',
    'ISRD', 'ISRN', 'ISPD', 'ISPN',
    'ECRD', 'ECRN', 'ECPD', 'ECPN',
    'ESRD', 'ESRN', 'ESPD', 'ESPN'
  ];
  v_type_distribution INT[] := ARRAY[4, 3, 4, 3, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 3, 3]; -- 총 50개
  v_type_index INT := 1;
  v_count INT;
  v_type TEXT;
  v_axis_scores JSONB;
  v_pole JSONB;
  v_answers JSONB;
  v_motivation_pole TEXT;
  v_flexibility_pole TEXT;
  v_direction_pole TEXT;
  v_communication_pole TEXT;
  v_motivation_intrinsic NUMERIC;
  v_motivation_extrinsic NUMERIC;
  v_flexibility_change NUMERIC;
  v_flexibility_system NUMERIC;
  v_direction_work NUMERIC;
  v_direction_people NUMERIC;
  v_communication_direct NUMERIC;
  v_communication_engage NUMERIC;
BEGIN
  -- 세션 ID 가져오기
  SELECT id INTO v_session_id
  FROM sessions
  WHERE session_code = 'test-session-001';
  
  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session test-session-001 not found';
  END IF;
  
  -- 각 유형별로 데이터 삽입
  FOR v_type_index IN 1..array_length(v_leadership_types, 1) LOOP
    v_type := v_leadership_types[v_type_index];
    v_count := v_type_distribution[v_type_index];
    
    -- 유형 코드에서 각 축의 극성 추출
    v_motivation_pole := CASE WHEN substring(v_type, 1, 1) = 'I' THEN 'intrinsic' ELSE 'extrinsic' END;
    v_flexibility_pole := CASE WHEN substring(v_type, 2, 1) = 'C' THEN 'change' ELSE 'system' END;
    v_direction_pole := CASE WHEN substring(v_type, 3, 1) = 'R' THEN 'work' ELSE 'people' END;
    v_communication_pole := CASE WHEN substring(v_type, 4, 1) = 'D' THEN 'direct' ELSE 'engage' END; -- 'N'도 'engage'로 처리
    
    -- 각 유형에 맞는 점수 생성 (해당 극성이 더 높도록)
    FOR i IN 1..v_count LOOP
      -- 점수 생성: 해당 극성이 더 높도록 (약간의 변동 추가)
      v_motivation_intrinsic := CASE 
        WHEN v_motivation_pole = 'intrinsic' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      v_motivation_extrinsic := CASE 
        WHEN v_motivation_pole = 'extrinsic' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      
      v_flexibility_change := CASE 
        WHEN v_flexibility_pole = 'change' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      v_flexibility_system := CASE 
        WHEN v_flexibility_pole = 'system' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      
      v_direction_work := CASE 
        WHEN v_direction_pole = 'work' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0)
      END;
      v_direction_people := CASE 
        WHEN v_direction_pole = 'people' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      
      v_communication_direct := CASE 
        WHEN v_communication_pole = 'direct' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      v_communication_engage := CASE 
        WHEN v_communication_pole = 'engage' THEN 5.0 + (random() * 1.5) 
        ELSE 3.0 + (random() * 1.0) 
      END;
      
      -- axis_scores JSONB 생성
      v_axis_scores := jsonb_build_object(
        'motivation', jsonb_build_object(
          'intrinsic', round(v_motivation_intrinsic::numeric, 2),
          'extrinsic', round(v_motivation_extrinsic::numeric, 2)
        ),
        'flexibility', jsonb_build_object(
          'change', round(v_flexibility_change::numeric, 2),
          'system', round(v_flexibility_system::numeric, 2)
        ),
        'direction', jsonb_build_object(
          'work', round(v_direction_work::numeric, 2),
          'people', round(v_direction_people::numeric, 2)
        ),
        'communication', jsonb_build_object(
          'direct', round(v_communication_direct::numeric, 2),
          'engage', round(v_communication_engage::numeric, 2)
        )
      );
      
      -- pole JSONB 생성
      v_pole := jsonb_build_object(
        'motivation', v_motivation_pole,
        'flexibility', v_flexibility_pole,
        'direction', v_direction_pole,
        'communication', v_communication_pole
      );
      
      -- answers JSONB 생성 (32문항, 각 1-7점 랜덤)
      -- 유형에 맞게 점수 생성 (해당 dimension 문항이 더 높도록)
      v_answers := jsonb_build_object(
        -- Motivation 축 (M1-M8: Intrinsic)
        'M1', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M2', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M3', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M4', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M5', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M6', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M7', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'M8', CASE WHEN v_motivation_pole = 'intrinsic' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        
        -- Flexibility 축 (F9-F16: Change)
        'F9', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F10', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F11', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F12', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F13', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F14', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F15', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'F16', CASE WHEN v_flexibility_pole = 'change' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        
        -- Direction 축 (D17-D24: Work)
        'D17', CASE WHEN v_direction_pole = 'work' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D18', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D19', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D20', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D21', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D22', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D23', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'D24', CASE WHEN v_direction_pole = 'results' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        
        -- Communication 축 (C25-C32: Direct)
        'C25', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C26', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C27', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C28', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C29', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C30', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C31', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END,
        'C32', CASE WHEN v_communication_pole = 'direct' THEN 4 + floor(random() * 4)::int ELSE 1 + floor(random() * 3)::int END
      );
      
      -- 응답 삽입
      INSERT INTO responses (
        session_id,
        leadership_type,
        axis_scores,
        pole,
        answers,
        created_at
      ) VALUES (
        v_session_id,
        v_type,
        v_axis_scores,
        v_pole,
        v_answers,
        NOW() - (random() * INTERVAL '7 days') -- 최근 7일 내 랜덤 시간
      );
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Successfully inserted 50 test responses for test-session-001';
END $$;

-- 3. 삽입된 데이터 확인
SELECT 
  leadership_type,
  COUNT(*) as count
FROM responses r
JOIN sessions s ON r.session_id = s.id
WHERE s.session_code = 'test-session-001'
GROUP BY leadership_type
ORDER BY count DESC, leadership_type;


