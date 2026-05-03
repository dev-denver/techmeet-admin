import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkTemplateCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");
  const serviceType = searchParams.get("service_type");
  const q = searchParams.get("q");

  const adminClient = createAdminClient();
  const includeBody = searchParams.get("include_body") === "true";
  const selectFields = includeBody
    ? "id, code, name, body, service_type, is_active, variables, created_at"
    : "id, code, name, service_type, is_active, variables, created_at";

  let query = adminClient
    .from("alimtalk_templates")
    .select(selectFields);

  if (active === "true") query = query.eq("is_active", true);
  else if (active === "false") query = query.eq("is_active", false);

  if (serviceType) query = query.eq("service_type", serviceType);
  if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`);

  const { data, error: dbError } = await query.order("created_at", { ascending: false });
  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, alimtalkTemplateCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("alimtalk_templates")
    .insert(body)
    .select()
    .single();

  if (dbError) {
    if (dbError.code === "23505") {
      return apiError("이미 등록된 코드입니다.", 409, "CONFLICT");
    }
    return apiDbError(dbError.message);
  }

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "alimtalk_template",
    resourceId: data.id,
    details: { code: body.code, name: body.name },
  });

  return apiSuccess(data, 201);
}
