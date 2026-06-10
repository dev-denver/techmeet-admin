import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiError, parseBody } from "@/lib/api/response";
import { userCreateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
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
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const adminClient = createAdminClient();
  let query = adminClient.from("profiles").select("*");

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (status) {
    query = query.eq("account_status", status);
  }

  const { data, error: dbError } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, userCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();

  // 전화번호 중복 검사 (입력된 경우에만)
  if (body.phone) {
    const digits = body.phone.replace(/-/g, "");
    const { count } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or(`phone.eq.${body.phone},phone.eq.${digits}`);
    if (count && count > 0) {
      return apiError("이미 등록된 전화번호입니다.", 409, "PHONE_EXISTS");
    }
  }

  // Supabase auth user 생성 (비밀번호 없음 — 카카오 OAuth 전용)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: body.email,
    email_confirm: true,
  });

  if (authError) {
    // status 422 or "already registered" → 이메일 중복
    if (authError.status === 422 || authError.message?.toLowerCase().includes("already registered")) {
      return apiError("이미 등록된 이메일입니다.", 409, "EMAIL_EXISTS");
    }
    return apiError("사용자 생성 중 오류가 발생했습니다.", 500, "AUTH_CREATE_ERROR");
  }

  const userId = authData.user.id;

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    email: body.email,
    name: body.name,
    phone: body.phone ?? null,
  });

  if (profileError) {
    // 프로필 삽입 실패 시 orphaned auth user 롤백
    await adminClient.auth.admin.deleteUser(userId);
    return apiDbError(profileError.message);
  }

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "user",
    resourceId: userId,
    details: { email: body.email, name: body.name },
  });

  return apiSuccess({ id: userId }, 201);
}
