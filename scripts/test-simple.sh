#!/bin/bash

# 간단한 API 테스트 스크립트 (디버깅용)
# 서버가 실행 중이어야 합니다

PORT=${1:-3000}
SESSION_CODE="test-session-001"

echo "🧪 간단한 API 테스트"
echo "포트: $PORT"
echo "세션 코드: $SESSION_CODE"
echo ""

# 1. 서버가 실행 중인지 확인
echo "1️⃣ 서버 연결 확인..."
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}" | grep -q "200\|404"; then
  echo "  ✅ 서버가 실행 중입니다"
else
  echo "  ❌ 서버가 실행되지 않았습니다"
  echo "  💡 npm run dev를 먼저 실행하세요"
  exit 1
fi

# 2. 제출 API 테스트
echo ""
echo "2️⃣ 제출 API 테스트..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "http://localhost:${PORT}/api/submit" \
  -H "Content-Type: application/json" \
  -d "{\"sessionCode\":\"${SESSION_CODE}\",\"answers\":{\"M1\":6,\"M2\":5,\"M3\":7,\"M4\":6,\"M5\":5,\"M6\":6,\"M7\":7,\"M8\":6,\"F9\":5,\"F10\":6,\"F11\":5,\"F12\":6,\"F13\":5,\"F14\":6,\"F15\":5,\"F16\":6,\"D17\":7,\"D18\":6,\"D19\":7,\"D20\":6,\"D21\":7,\"D22\":6,\"D23\":7,\"D24\":6,\"C25\":6,\"C26\":7,\"C27\":6,\"C28\":7,\"C29\":6,\"C30\":7,\"C31\":6,\"C32\":7}}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "  HTTP 상태 코드: $HTTP_STATUS"
echo "  응답 본문:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$HTTP_STATUS" = "200" ]; then
  echo ""
  echo "  ✅ API 호출 성공!"
elif [ -z "$HTTP_STATUS" ]; then
  echo ""
  echo "  ❌ 서버에 연결할 수 없습니다"
  echo "  💡 서버가 실행 중인지 확인하세요 (npm run dev)"
  exit 1
else
  echo ""
  echo "  ❌ API 호출 실패 (HTTP $HTTP_STATUS)"
  echo ""
  echo "  💡 에러별 해결 방법:"
  if [ "$HTTP_STATUS" = "404" ]; then
    echo "     - 404: API 라우트를 찾을 수 없음"
    echo "     - 서버를 재시작해보세요 (Ctrl+C 후 npm run dev)"
  elif [ "$HTTP_STATUS" = "500" ]; then
    echo "     - 500: 서버 내부 에러"
    echo "     - 개발 서버 콘솔에서 에러 메시지를 확인하세요"
  elif [ "$HTTP_STATUS" = "400" ]; then
    echo "     - 400: 잘못된 요청 데이터"
    echo "     - 응답 본문의 에러 메시지를 확인하세요"
  else
    echo "     - HTTP $HTTP_STATUS 에러 발생"
    echo "     - 응답 본문을 확인하세요"
  fi
  exit 1
fi

