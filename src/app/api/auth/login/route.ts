import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return apiError("이메일과 비밀번호를 입력해주세요.", 400);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return apiError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
  }

  const adminClient = createAdminClient();
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("id, name, role")
    .eq("auth_user_id", data.user.id)
    .single();

  if (!adminUser) {
    await supabase.auth.signOut();
    return apiError("관리자 권한이 없습니다.", 401);
  }

  return apiSuccess({ admin: adminUser });
}
