import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "./response";

export async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: apiError("인증이 필요합니다.", 401),
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
      error: apiError("관리자 권한이 없습니다.", 403),
      adminUser: null,
    };
  }

  return { error: null, adminUser, adminClient };
}

export async function verifySuperAdmin() {
  const result = await verifyAdmin();
  if (result.error) return result;
  if (result.adminUser?.role !== "superadmin") {
    return {
      error: apiError("슈퍼관리자 권한이 필요합니다.", 403),
      adminUser: null,
      adminClient: null,
    };
  }
  return result;
}
