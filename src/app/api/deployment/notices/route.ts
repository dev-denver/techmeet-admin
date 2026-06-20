import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { deploymentProjectNoticeCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  const adminClient = createAdminClient();
  let query = adminClient
    .from("deployment_project_notices")
    .select("*")
    .order("notice_date", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error: dbError } = await query;

  if (dbError) return apiDbError(dbError.message);
  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, deploymentProjectNoticeCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("deployment_project_notices")
    .insert(body)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "deployment_project_notices",
    resourceId: data.id,
    details: { project_id: body.project_id },
  });

  return apiSuccess(data, 201);
}
