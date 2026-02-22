import { createAdminClient } from "@/lib/supabase/admin";

interface AuditLogEntry {
  adminId: string;
  adminName: string;
  action: "create" | "update" | "delete" | "bulk_update" | "bulk_delete";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("admin_audit_logs").insert({
      admin_id: entry.adminId,
      admin_name: entry.adminName,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId ?? null,
      details: entry.details ?? null,
    });
  } catch {
    // Audit logging should never block the main operation
    console.error("Failed to write audit log");
  }
}
