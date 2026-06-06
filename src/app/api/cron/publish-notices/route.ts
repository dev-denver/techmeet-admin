import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

/**
 * Vercel Cron 전용 엔드포인트.
 * - 예약 공지(notice_type='scheduled')의 start_at이 도래하면 자동 게시
 * - 게시 중인 공지의 end_at이 경과하면 자동 비공개
 *
 * 보호: CRON_SECRET 설정 시 Vercel Cron이 보내는 `Authorization: Bearer <secret>` 검증.
 * 관리자 세션이 없는 컨텍스트이므로 service_role(createAdminClient)을 사용한다.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const adminClient = createAdminClient();
  const nowIso = new Date().toISOString();

  // 1) 게시 시작: 예약 공지 중 start_at 도래 & 미게시 & 미삭제
  const { data: published, error: publishError } = await adminClient
    .from("notices")
    .update({ is_published: true, updated_at: nowIso })
    .eq("notice_type", "scheduled")
    .eq("is_published", false)
    .is("deleted_at", null)
    .lte("start_at", nowIso)
    .select("id");

  if (publishError) {
    logger.error("Cron publish-notices: publish failed", {
      detail: publishError.message,
    });
    return Response.json({ ok: false, stage: "publish" }, { status: 500 });
  }

  // 2) 게시 종료: 게시 중 & end_at 경과 & 미삭제 → 자동 비공개
  const { data: expired, error: expireError } = await adminClient
    .from("notices")
    .update({ is_published: false, updated_at: nowIso })
    .eq("is_published", true)
    .is("deleted_at", null)
    .not("end_at", "is", null)
    .lte("end_at", nowIso)
    .select("id");

  if (expireError) {
    logger.error("Cron publish-notices: expire failed", {
      detail: expireError.message,
    });
    return Response.json({ ok: false, stage: "expire" }, { status: 500 });
  }

  const result = {
    ok: true,
    publishedCount: published?.length ?? 0,
    expiredCount: expired?.length ?? 0,
    ranAt: nowIso,
  };
  logger.info("Cron publish-notices completed", result);

  return Response.json(result);
}
