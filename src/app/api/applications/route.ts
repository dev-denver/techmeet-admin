import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE)
  );
  const status = searchParams.get("status");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const adminClient = createAdminClient();
  let query = adminClient
    .from("applications")
    .select(`
      *,
      project:projects(id, title),
      profile:profiles!freelancer_id(id, name, email)
    `);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error: dbError } = await query
    .order("applied_at", { ascending: false })
    .range(from, to);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data ?? []);
}
