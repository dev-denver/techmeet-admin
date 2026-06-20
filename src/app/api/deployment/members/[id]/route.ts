import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiNotFound, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { deploymentProjectMemberUpdateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("deployment_project_members")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) return apiNotFound("투입 인원");
  return apiSuccess(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, deploymentProjectMemberUpdateSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data, error: dbError } = await adminClient
    .from("deployment_project_members")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "update",
    resource: "deployment_project_members",
    resourceId: id,
    details: body,
  });

  return apiSuccess(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("deployment_project_members")
    .delete()
    .eq("id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "deployment_project_members",
    resourceId: id,
  });

  return apiSuccess({ deleted: true });
}
