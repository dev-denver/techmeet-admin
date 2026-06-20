import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkSendSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
import { sendSms, findSms, isTerminalGroupStatus, computeIsSuccess } from "@/lib/services/sendon";
import { logger } from "@/lib/observability/logger";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 즉시 발송 건은 응답 전에 짧게 폴링해 실제 발송 결과를 확정한다 (최대 3회 x 2초).
// 폴링 시간 내 확정되지 않으면 group_status='PROCESSING' 상태로 남고, 이후 cron(/api/cron/sms-status)이 보정한다.
const POLL_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2000;

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

  const sendResults = await Promise.allSettled(
    (insertedLogs ?? []).map(async (log) => {
      const profile = profiles?.find((p) => p.id === log.user_id);
      if (!profile?.phone) {
        return { logId: log.id, accepted: false, groupId: undefined, error: "전화번호 없음" };
      }
      const r = await sendSms(profile.phone, content, send_type === "scheduled" ? (scheduled_at ?? null) : null, title);
      if (!r.success) {
        logger.error("Sendon SMS 발송 실패", { logId: log.id, error: r.error });
      }
      return { logId: log.id, accepted: r.success, groupId: r.groupId ?? r.reservationId, error: r.error };
    })
  );

  const pendingPolls: { logId: string; groupId: string }[] = [];

  for (const r of sendResults) {
    if (r.status !== "fulfilled") continue;
    const { logId, accepted, groupId, error: sendError } = r.value;

    if (!accepted || !groupId) {
      await adminClient.from("alimtalk_logs").update({
        is_success: false,
        error_message: sendError ?? "발송 실패",
      }).eq("id", logId);
      continue;
    }

    await adminClient.from("alimtalk_logs").update({
      message_id: groupId,
      group_status: send_type === "scheduled" ? "RESERVED" : "PROCESSING",
      error_message: null,
    }).eq("id", logId);

    if (send_type === "immediate") {
      pendingPolls.push({ logId, groupId });
    }
  }

  let remaining = pendingPolls;
  for (let attempt = 0; attempt < POLL_ATTEMPTS && remaining.length > 0; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const polled = await Promise.allSettled(
      remaining.map(async (p) => ({ ...p, result: await findSms(p.groupId) }))
    );
    const stillPending: typeof remaining = [];
    for (const r of polled) {
      if (r.status !== "fulfilled") continue;
      const { logId, groupId, result } = r.value;
      if (!result.found || !isTerminalGroupStatus(result.groupStatus)) {
        stillPending.push({ logId, groupId });
        continue;
      }
      const success = computeIsSuccess(result);
      await adminClient.from("alimtalk_logs").update({
        is_success: success,
        group_status: result.groupStatus,
        sent_at: success ? new Date().toISOString() : null,
      }).eq("id", logId);
    }
    remaining = stillPending;
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
