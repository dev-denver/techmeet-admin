import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { projectCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET() {
  const { error } = await verifyAdmin();
  if (error) return error;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, projectCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("projects")
    .insert(body)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "projects",
    resourceId: data.id,
    details: { title: body.title },
  });

  return apiSuccess(data, 201);
}
