import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { findSms, isTerminalGroupStatus, computeIsSuccess } from "@/lib/services/sendon";

/**
 * Vercel Cron 전용 엔드포인트.
 * - 문자 발송(alimtalk_logs) 중 아직 최종 결과(is_success)가 확정되지 않은 건을
 *   Sendon find API로 재조회해 실제 통신사 처리 결과를 반영한다.
 * - 발송 직후 짧은 폴링(api/alimtalk/send)에서 확정되지 못한 건과,
 *   예약 발송 중 발송 시각이 지난 건을 보정 대상으로 한다.
 *
 * 보호: CRON_SECRET 설정 시 Vercel Cron이 보내는 `Authorization: Bearer <secret>` 검증.
 */
const BATCH_LIMIT = 200;
const LOOKBACK_DAYS = 7;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const adminClient = createAdminClient();
  const lookbackIso = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingLogs, error: fetchError } = await adminClient
    .from("alimtalk_logs")
    .select("id, message_id")
    .is("is_success", null)
    .not("message_id", "is", null)
    .gte("created_at", lookbackIso)
    .limit(BATCH_LIMIT);

  if (fetchError) {
    logger.error("Cron sms-status: fetch failed", { detail: fetchError.message });
    return Response.json({ ok: false, stage: "fetch" }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (pendingLogs ?? []).map(async (log) => {
      const result = await findSms(log.message_id as string);
      if (!result.found || !isTerminalGroupStatus(result.groupStatus)) {
        return { updated: false };
      }
      const success = computeIsSuccess(result);
      await adminClient
        .from("alimtalk_logs")
        .update({
          is_success: success,
          group_status: result.groupStatus,
          sent_at: success ? new Date().toISOString() : null,
        })
        .eq("id", log.id);
      return { updated: true };
    })
  );

  const updatedCount = results.filter((r) => r.status === "fulfilled" && r.value.updated).length;

  const summary = {
    ok: true,
    checkedCount: pendingLogs?.length ?? 0,
    updatedCount,
    ranAt: new Date().toISOString(),
  };
  logger.info("Cron sms-status completed", summary);

  return Response.json(summary);
}
