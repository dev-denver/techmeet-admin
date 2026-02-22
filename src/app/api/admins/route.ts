import { NextRequest } from "next/server";
import { verifySuperAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiError, parseBody } from "@/lib/api/response";
import { adminCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET() {
  const { error, adminClient } = await verifySuperAdmin();
  if (error) return error;

  const { data, error: dbError } = await adminClient!
    .from("admin_users")
    .select("id, auth_user_id, name, email, role, created_at")
    .order("created_at", { ascending: true });

  if (dbError) return apiDbError("관리자 목록 조회 실패");

  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const { error, adminClient, adminUser } = await verifySuperAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, adminCreateSchema);
  if (parseError) return parseError;

  const { name, email, password, role } = body;

  const { data: authData, error: authError } = await adminClient!.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    const message = authError?.message ?? "Auth 계정 생성 실패";
    return apiError(message, 400);
  }

  const { error: insertError } = await adminClient!.from("admin_users").insert({
    auth_user_id: authData.user.id,
    name,
    email,
    role,
  });

  if (insertError) {
    await adminClient!.auth.admin.deleteUser(authData.user.id);
    return apiDbError("관리자 등록 실패");
  }

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "admins",
    details: { name, email, role },
  });

  return apiSuccess({ message: "관리자가 등록되었습니다." }, 201);
}
