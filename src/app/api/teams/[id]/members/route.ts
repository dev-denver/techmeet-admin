import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamMemberAddSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";
import { z } from "zod";

const teamMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["leader", "member"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, teamMemberAddSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

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

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "create",
    resource: "teams",
    resourceId: id,
    details: { member_added: body.profile_id, role: body.role },
  });

  return apiSuccess(data, 201);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return apiError("멤버 ID가 필요합니다.", 400);
  }

  const adminClient = createAdminClient();

  // 삭제 대상이 leader인지 확인 후, 남은 leader가 없어지는지 체크
  const { data: target } = await adminClient
    .from("profile_teams")
    .select("role")
    .eq("id", memberId)
    .eq("team_id", id)
    .single();

  if (target?.role === "leader") {
    const { count } = await adminClient
      .from("profile_teams")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id)
      .eq("role", "leader");

    if ((count ?? 0) <= 1) {
      return apiError("팀에 리더가 최소 1명 이상 있어야 합니다.", 400);
    }
  }

  const { error: dbError } = await adminClient
    .from("profile_teams")
    .delete()
    .eq("id", memberId)
    .eq("team_id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "teams",
    resourceId: id,
    details: { member_removed: memberId },
  });

  return apiSuccess({ deleted: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = teamMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("올바른 멤버 ID와 역할을 입력해주세요.", 400);
  }
  const { memberId, role } = parsed.data;

  // leader → member 강등 시 마지막 리더 보호
  if (role === "member") {
    const { data: target } = await (createAdminClient())
      .from("profile_teams")
      .select("role")
      .eq("id", memberId)
      .eq("team_id", id)
      .single();

    if (target?.role === "leader") {
      const adminClient = createAdminClient();
      const { count } = await adminClient
        .from("profile_teams")
        .select("*", { count: "exact", head: true })
        .eq("team_id", id)
        .eq("role", "leader");

      if ((count ?? 0) <= 1) {
        return apiError("팀에 리더가 최소 1명 이상 있어야 합니다.", 400);
      }
    }
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

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "update",
    resource: "teams",
    resourceId: id,
    details: { member_role_changed: memberId, new_role: role },
  });

  return apiSuccess(data);
}
