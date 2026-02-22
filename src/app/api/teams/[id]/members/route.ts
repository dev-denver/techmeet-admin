import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamMemberAddSchema } from "@/lib/api/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, teamMemberAddSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

  // Check if already a member
  const { data: existing } = await adminClient
    .from("profile_teams")
    .select("id")
    .eq("team_id", id)
    .eq("profile_id", body.profile_id)
    .single();

  if (existing) {
    return apiError("이미 팀에 소속된 멤버입니다.", 409);
  }

  const { data, error: dbError } = await adminClient
    .from("profile_teams")
    .insert({
      team_id: id,
      profile_id: body.profile_id,
      role: body.role,
    })
    .select(`
      id, role, joined_at,
      profile:profiles(id, name, email)
    `)
    .single();

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data, 201);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return apiError("멤버 ID가 필요합니다.", 400);
  }

  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("profile_teams")
    .delete()
    .eq("id", memberId)
    .eq("team_id", id);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess({ deleted: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const { memberId, role } = await request.json();

  if (!memberId || !["leader", "member"].includes(role)) {
    return apiError("올바른 멤버 ID와 역할을 입력해주세요.", 400);
  }

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("profile_teams")
    .update({ role })
    .eq("id", memberId)
    .eq("team_id", id)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data);
}
