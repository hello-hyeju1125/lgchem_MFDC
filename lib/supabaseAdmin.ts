/**
 * Supabase Admin 클라이언트
 * 
 * 이 파일은 서버 사이드에서만 사용되며, Service Role Key를 사용하여
 * RLS(Row Level Security)를 우회하고 관리자 권한으로 데이터베이스에 접근합니다.
 * 
 * 주의: 이 클라이언트는 서버 사이드에서만 사용하고,
 * 절대로 클라이언트 사이드 코드나 환경 변수에 노출되면 안 됩니다.
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Service Role Key를 사용하는 관리자 클라이언트
 * - RLS를 우회하여 모든 데이터에 접근 가능
 * - 집계 함수 호출 및 관리 작업에 사용
 * - 클라이언트 사이드에서 절대 사용하지 말 것
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Anonymous 클라이언트 (제출용)
 * - 익명 사용자가 responses 테이블에 INSERT만 할 수 있도록 하는 클라이언트
 * - RLS 정책에 따라 제한된 권한만 가짐
 */
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. 제출 API가 정상 작동하지 않을 수 있습니다.');
}

export const supabaseAnonymous = createClient(supabaseUrl, supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      // INSERT 후 반환값을 요청하지 않도록 함 (SELECT 권한 불필요)
      'Prefer': 'return=minimal',
    },
  },
});

