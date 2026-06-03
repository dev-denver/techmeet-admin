import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("profile_resumes")
    .select("*")
    .eq("profile_id", id)
    .order("created_at", { ascending: false });

  if (dbError) return apiError(dbError.message, 500, "DATABASE_ERROR");

  return apiSuccess(data ?? []);
}
