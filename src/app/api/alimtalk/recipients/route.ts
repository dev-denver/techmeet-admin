import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
  const q = searchParams.get("q");
  const projectId = searchParams.get("projectId");
  const accountStatus = searchParams.get("accountStatus") ?? "active";
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const adminClient = createAdminClient();
  const query = projectId
    ? adminClient
        .from("profiles")
        .select("id, name, email, phone, account_status, applications!inner(project_id)", { count: "exact" })
        .eq("applications.project_id", projectId)
    : adminClient
        .from("profiles")
        .select("id, name, email, phone, account_status", { count: "exact" });

  if (accountStatus) {
    query.eq("account_status", accountStatus);
  }
  if (q) {
    query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, count, error: dbError } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (dbError) return apiDbError(dbError.message);

  const recipients = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
  }));

  return apiSuccess({ recipients, total: count ?? 0 });
}
