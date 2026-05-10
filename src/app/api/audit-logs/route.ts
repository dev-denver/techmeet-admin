import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const action = searchParams.get("action");
  const resource = searchParams.get("resource");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const adminClient = createAdminClient();
  let query = adminClient
    .from("admin_audit_logs")
    .select("*", { count: "exact" });

  if (action) query = query.eq("action", action);
  if (resource) query = query.eq("resource", resource);

  const { data, count, error: dbError } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess({ logs: data ?? [], total: count ?? 0 });
}
