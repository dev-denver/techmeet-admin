import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

/**
 * service_role 클라이언트 - RLS를 우회하여 관리자 작업에 사용
 * 반드시 서버 사이드(API Route, Server Component)에서만 사용
 */
export function createAdminClient() {
  return createClient(env.supabase.url, env.supabase.serviceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
