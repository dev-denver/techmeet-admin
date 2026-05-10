import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const { email, password } = body;

  if (!email || !password) {
    return apiError("이메일과 비밀번호를 입력해주세요.", 400);
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return apiError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const adminClient = createAdminClient();
  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("id, name, role")
    .eq("auth_user_id", data.user.id)
    .single();

  if (adminError || !adminUser) {
    await supabase.auth.signOut();
    return apiError("관리자 권한이 없습니다.", 401);
  }

  return apiSuccess({ admin: adminUser });
}
