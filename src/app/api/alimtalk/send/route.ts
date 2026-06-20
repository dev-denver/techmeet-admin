import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkSendSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
import { sendSms } from "@/lib/services/sendon";

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, alimtalkSendSchema);
  if (parseError) return parseError;

  const { title, content, send_type, scheduled_at, user_ids } = body;

  const adminClient = createAdminClient();

  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, phone")
    .in("id", user_ids);

  const logs = user_ids.map((user_id) => ({
    user_id,
    title,
    content,
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
      const profile = profiles?.find((p) => p.id === log.user_id);
      if (!profile?.phone) {
        return Promise.resolve({ logId: log.id, success: false, error: "전화번호 없음" } as const);
      }
      return sendSms(profile.phone, content, send_type === "scheduled" ? (scheduled_at ?? null) : null, title)
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

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "alimtalk",
    details: {
      title,
      send_type,
      scheduled_at: scheduled_at ?? null,
      target_count: user_ids.length,
    },
  });

  return apiSuccess({ sent: true });
}
