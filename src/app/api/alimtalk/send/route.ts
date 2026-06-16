import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkSendSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
import { sendSms } from "@/lib/services/sendon";

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, alimtalkSendSchema);
  if (parseError) return parseError;

  const { template_id, service_type, send_type, scheduled_at, target, user_id } = body;

  const adminClient = createAdminClient();

  const { data: template } = await adminClient
    .from("alimtalk_templates")
    .select("code, name, body, is_active")
    .eq("id", template_id)
    .single();

  if (!template || !template.is_active) {
    return apiError("유효하지 않은 템플릿입니다.", 422, "UNPROCESSABLE");
  }

  const { code: template_code, name: template_name, body: message } = template;

  if (target === "individual" && user_id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("phone_number")
      .eq("id", user_id)
      .single();

    const { data: insertedLogs, error: dbError } = await adminClient
      .from("alimtalk_logs")
      .insert({ user_id, template_code, template_name, service_type, send_type, scheduled_at: scheduled_at ?? null, is_success: null })
      .select("id");

    if (dbError) return apiDbError(dbError.message);

    if (profile?.phone_number && insertedLogs?.[0]) {
      const result = await sendSms(profile.phone_number, message, send_type === "scheduled" ? (scheduled_at ?? null) : null);
      await adminClient.from("alimtalk_logs").update({
        is_success: result.success,
        message_id: result.groupId ?? result.reservationId ?? null,
        sent_at: result.success && send_type === "immediate" ? new Date().toISOString() : null,
        error_message: result.error ?? null,
      }).eq("id", insertedLogs[0].id);
    }
  } else {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, phone_number")
      .eq("account_status", "active");

    if (!profiles || profiles.length === 0) {
      return apiSuccess({ sent: true, count: 0 });
    }

    const logs = profiles.map((p) => ({
      user_id: p.id,
      template_code,
      template_name,
      service_type,
      send_type,
      scheduled_at: scheduled_at ?? null,
      is_success: null,
    }));

    const { data: insertedLogs, error: dbError } = await adminClient
      .from("alimtalk_logs")
      .insert(logs)
      .select("id, user_id");

    if (dbError) return apiDbError(dbError.message);

    const results = await Promise.allSettled(
      (insertedLogs ?? []).map((log) => {
        const p = profiles.find((pr) => pr.id === log.user_id);
        if (!p?.phone_number) {
          return Promise.resolve({ logId: log.id, success: false, error: "전화번호 없음" } as const);
        }
        return sendSms(p.phone_number, message, send_type === "scheduled" ? (scheduled_at ?? null) : null)
          .then((r) => ({ logId: log.id, ...r }));
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        const { logId, success, error: sendError } = r.value;
        const messageId = "groupId" in r.value ? (r.value.groupId ?? r.value.reservationId ?? null) : null;
        await adminClient.from("alimtalk_logs").update({
          is_success: success,
          message_id: messageId,
          sent_at: success && send_type === "immediate" ? new Date().toISOString() : null,
          error_message: sendError ?? null,
        }).eq("id", logId);
      }
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
