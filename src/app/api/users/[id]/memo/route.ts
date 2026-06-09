import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiNotFound, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { userMemoUpdateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("user_admin_memos")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  return apiSuccess(data ?? { user_id: id, memo: "" });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, userMemoUpdateSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!profile) return apiNotFound("사용자");

  const { data, error: dbError } = await adminClient
    .from("user_admin_memos")
    .upsert(
      {
        user_id: id,
        memo: body.memo,
        updated_at: new Date().toISOString(),
        updated_by_id: adminUser!.id,
        updated_by_name: adminUser!.name,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "update",
    resource: "user_memos",
    resourceId: id,
    details: { memo: body.memo },
  });

  return apiSuccess(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();

  const { error: dbError } = await adminClient
    .from("user_admin_memos")
    .delete()
    .eq("user_id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "user_memos",
    resourceId: id,
  });

  return apiSuccess(null);
}
