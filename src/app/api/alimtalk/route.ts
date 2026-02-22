import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await verifyAdmin();
  if (error) return error;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("alimtalk_logs")
    .select(`
      *,
      profile:profiles(id, name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data);
}
