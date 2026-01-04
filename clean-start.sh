#!/bin/bash

# 깨끗한 서버 시작 스크립트

echo "🧹 실행 중인 프로세스 정리 중..."
pkill -9 -f "next dev" 2>/dev/null
sleep 1

echo "🧹 포트 정리 중..."
lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

echo "✅ 정리 완료!"
echo ""
echo "이제 다음 명령어로 서버를 시작하세요:"
echo "  npm run dev"
echo ""

