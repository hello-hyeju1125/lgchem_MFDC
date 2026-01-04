#!/bin/bash

# Supabase 세션 확인 스크립트
# Supabase SQL Editor에서 실행할 SQL을 제공합니다

SESSION_CODE="test-session-001"

echo "🔍 Supabase 세션 확인"
echo "===================="
echo ""
echo "다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:"
echo ""
echo "---"
echo ""
echo "-- 1. 세션 조회"
echo "SELECT id, session_code, title, created_at FROM sessions WHERE session_code = '${SESSION_CODE}';"
echo ""
echo "-- 2. 세션이 없으면 생성"
echo "INSERT INTO sessions (session_code, title, starts_at)"
echo "VALUES ('${SESSION_CODE}', '테스트 세션', NOW())"
echo "ON CONFLICT (session_code) DO NOTHING"
echo "RETURNING id, session_code, title;"
echo ""
echo "-- 3. 모든 세션 확인"
echo "SELECT session_code, title FROM sessions ORDER BY created_at DESC LIMIT 10;"
echo ""
echo "---"
echo ""

