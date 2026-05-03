import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiNotFound, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkTemplateUpdateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("alimtalk_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) return apiNotFound("템플릿");

  return apiSuccess(data);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const { data: body, error: parseError } = await parseBody(request, alimtalkTemplateUpdateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("alimtalk_templates")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError || !data) return apiNotFound("템플릿");

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "update",
    resource: "alimtalk_template",
    resourceId: id,
    details: body as Record<string, unknown>,
  });

  return apiSuccess(data);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();

  // 템플릿 조회
  const { data: template, error: fetchError } = await adminClient
    .from("alimtalk_templates")
    .select("id, code, name")
    .eq("id", id)
    .single();

  if (fetchError || !template) return apiNotFound("템플릿");

  // 발송 이력 확인
  const { count } = await adminClient
    .from("alimtalk_logs")
    .select("id", { count: "exact", head: true })
    .eq("template_code", template.code);

  if (count && count > 0) {
    return apiError("발송 이력이 있는 템플릿은 삭제할 수 없습니다. 비활성화를 사용해주세요.", 409, "CONFLICT");
  }

  const { error: dbError } = await adminClient
    .from("alimtalk_templates")
    .delete()
    .eq("id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "alimtalk_template",
    resourceId: id,
    details: { code: template.code, name: template.name },
  });

  return apiSuccess({ deleted: true });
}
