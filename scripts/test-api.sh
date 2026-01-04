#!/bin/bash

# API 테스트 스크립트
# 사용법: bash scripts/test-api.sh

# 설정 (필요시 수정)
# PORT: 서버가 실행되는 포트 번호 (npm run dev 실행 시 표시되는 포트)
PORT=3000
SESSION_CODE="test-session-001"
ADMIN_KEY="lgchem-leadership-admin-2026-secure"

echo "🧪 리더십 진단 API 테스트"
echo "================================"
echo ""

# 1. 제출 API 테스트 (ICRD 유형)
echo "1️⃣ 제출 API 테스트 (ICRD 유형)..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:${PORT}/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "sessionCode": "'"${SESSION_CODE}"'",
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
  }')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

# 2. 관리자 집계 API 테스트
echo "2️⃣ 관리자 집계 API 테스트..."
echo ""

AGGREGATE_RESPONSE=$(curl -s "http://localhost:${PORT}/api/admin/aggregates?session_code=${SESSION_CODE}&admin_key=${ADMIN_KEY}")

echo "$AGGREGATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AGGREGATE_RESPONSE"
echo ""

echo "✅ 테스트 완료!"

