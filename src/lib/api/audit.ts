import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";

interface AuditLogEntry {
  adminId: string;
  adminName: string;
  action: "create" | "update" | "delete" | "restore" | "bulk_update" | "bulk_delete" | "bulk_restore";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ipAddress =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null;
      userAgent = h.get("user-agent") ?? null;
    } catch {
      // 요청 스코프가 아닌 컨텍스트(예: cron)에서는 headers() 사용 불가 → 무시
    }

    const adminClient = createAdminClient();
    await adminClient.from("admin_audit_logs").insert({
      admin_id: entry.adminId,
      admin_name: entry.adminName,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId ?? null,
      details: entry.details ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch {
    // 감사 로그 실패가 본 작업을 막지 않도록 한다
    logger.error("Failed to write audit log");
  }
}
