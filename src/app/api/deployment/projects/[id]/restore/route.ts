import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/api/audit";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("deployment_projects")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "restore",
    resource: "deployment_projects",
    resourceId: id,
  });

  return apiSuccess({ restored: true });
}
