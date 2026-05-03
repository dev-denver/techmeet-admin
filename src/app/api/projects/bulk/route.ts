import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiError, apiValidationError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { bulkStatusSchema, bulkDeleteSchema, bulkVisibilitySchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function PATCH(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("요청 본문이 올바르지 않습니다.", 400, "BAD_REQUEST");
  }

  const adminClient = createAdminClient();

  // 노출 여부 일괄 변경
  if (raw && typeof raw === "object" && "is_visible" in raw) {
    const parsed = bulkVisibilitySchema.safeParse(raw);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { ids, is_visible } = parsed.data;
    const { error: dbError } = await adminClient
      .from("projects")
      .update({ is_visible, updated_at: new Date().toISOString() })
      .in("id", ids);

    if (dbError) return apiDbError(dbError.message);

    await logAudit({
      adminId: adminUser!.id,
      adminName: adminUser!.name,
      action: "bulk_update",
      resource: "projects",
      details: { ids, is_visible, count: ids.length },
    });

    return apiSuccess({ updated: ids.length });
  }

  // 상태 일괄 변경
  const parsed = bulkStatusSchema.safeParse(raw);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { ids, status } = parsed.data;
  const { error: dbError } = await adminClient
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "bulk_update",
    resource: "projects",
    details: { ids, status, count: ids.length },
  });

  return apiSuccess({ updated: ids.length });
}

export async function DELETE(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, bulkDeleteSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("projects")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in("id", body.ids);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "bulk_delete",
    resource: "projects",
    details: { ids: body.ids, count: body.ids.length },
  });

  return apiSuccess({ deleted: body.ids.length });
}
