import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 }),
      adminUser: null,
    };
  }

  const adminClient = createAdminClient();
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("id, name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!adminUser) {
    return {
      error: NextResponse.json(
        { message: "관리자 권한이 없습니다." },
        { status: 403 }
      ),
      adminUser: null,
    };
  }

  return { error: null, adminUser, adminClient };
}
