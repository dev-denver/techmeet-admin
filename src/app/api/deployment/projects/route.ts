import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { deploymentProjectCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
import { parsePageParams } from "@/lib/utils/pagination";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const deleted = searchParams.get("deleted") === "true";
  const { from, to } = parsePageParams({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  const adminClient = createAdminClient();
  let query = adminClient
    .from("deployment_projects")
    .select("*", { count: "exact" });

  query = deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (q) query = query.ilike("name", `%${q}%`);
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  const { data, count, error: dbError } = await query
    .order("seq_id", { ascending: true })
    .range(from, to);

  if (dbError) return apiDbError(dbError.message);
  return apiSuccess({ data: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, deploymentProjectCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("deployment_projects")
    .insert(body)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "deployment_projects",
    resourceId: data.id,
    details: { name: body.name, type: body.type },
  });

  return apiSuccess(data, 201);
}
