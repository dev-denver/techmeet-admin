import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { smMemberCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const site = searchParams.get("site");

  const adminClient = createAdminClient();
  let query = adminClient
    .from("deployment_sm_members")
    .select("*")
    .order("seq_id", { ascending: true });

  if (site) {
    query = query.ilike("site", `%${site}%`);
  }

  const { data, error: dbError } = await query;

  if (dbError) return apiDbError(dbError.message);
  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, smMemberCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("deployment_sm_members")
    .insert(body)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "deployment_sm_members",
    resourceId: data.id,
    details: { site: body.site, name: body.name },
  });

  return apiSuccess(data, 201);
}
