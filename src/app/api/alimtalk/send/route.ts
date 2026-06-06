import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkSendSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, alimtalkSendSchema);
  if (parseError) return parseError;

  const {
    template_id,
    service_type,
    send_type,
    scheduled_at,
    target,
    user_id,
  } = body;

  const adminClient = createAdminClient();

  // template_id → 템플릿 조회
  const { data: template } = await adminClient
    .from("alimtalk_templates")
    .select("code, name, is_active")
    .eq("id", template_id)
    .single();

  if (!template || !template.is_active) {
    return apiError("유효하지 않은 템플릿입니다.", 422, "UNPROCESSABLE");
  }

  const { code: template_code, name: template_name } = template;

  if (target === "individual" && user_id) {
    const { error: dbError } = await adminClient.from("alimtalk_logs").insert({
      user_id,
      template_code,
      template_name,
      service_type,
      send_type,
      scheduled_at: scheduled_at ?? null,
      is_success: null,
    });

    if (dbError) return apiDbError(dbError.message);
  } else {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("account_status", "active");

    if (profiles && profiles.length > 0) {
      const logs = profiles.map((p) => ({
        user_id: p.id,
        template_code,
        template_name,
        service_type,
        send_type,
        scheduled_at: scheduled_at ?? null,
        is_success: null,
      }));

      const { error: dbError } = await adminClient
        .from("alimtalk_logs")
        .insert(logs);

      if (dbError) return apiDbError(dbError.message);
    }
  }

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "alimtalk",
    resourceId: template_id,
    details: {
      template_code,
      template_name,
      service_type,
      send_type,
      target,
      scheduled_at: scheduled_at ?? null,
      ...(target === "individual" && user_id ? { user_id } : {}),
    },
  });

  return apiSuccess({ sent: true });
}
