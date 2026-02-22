import { NextRequest } from "next/server";
import { verifySuperAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiNotFound, apiError } from "@/lib/api/response";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/api/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, adminClient, adminUser } = await verifySuperAdmin();
  if (error) return error;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: target } = await adminClient!
    .from("admin_users")
    .select("id, auth_user_id, role, name, email")
    .eq("id", id)
    .single();

  if (!target) return apiNotFound("관리자");

  const { data: selfRecord } = await adminClient!
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  if (selfRecord?.id === id) {
    return apiError("본인 계정은 삭제할 수 없습니다.", 400);
  }

  if (target.role === "superadmin") {
    const { count } = await adminClient!
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .eq("role", "superadmin");

    if ((count ?? 0) <= 1) {
      return apiError("마지막 슈퍼관리자 계정은 삭제할 수 없습니다.", 400);
    }
  }

  const { error: deleteError } = await adminClient!
    .from("admin_users")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return apiError("삭제 실패", 500);
  }

  await adminClient!.auth.admin.deleteUser(target.auth_user_id);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "admins",
    resourceId: id,
    details: { name: target.name, email: target.email },
  });

  return apiSuccess({ message: "삭제되었습니다." });
}
