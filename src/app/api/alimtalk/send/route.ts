import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { alimtalkSendSchema } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, alimtalkSendSchema);
  if (parseError) return parseError;

  const {
    template_code,
    template_name,
    service_type,
    send_type,
    scheduled_at,
    target,
    user_id,
  } = body;

  const adminClient = createAdminClient();

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

  return apiSuccess({ sent: true });
}
