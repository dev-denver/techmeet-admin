import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  const response = apiSuccess({ loggedOut: true });
  // 권한 단기 캐시 쿠키 무효화 (회수/로그아웃 즉시 반영)
  response.cookies.set("__admin_ok", "", { maxAge: 0, path: "/" });
  return response;
}
