import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiNotFound, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamUpdateSchema } from "@/lib/api/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("teams")
    .select(`
      *,
      members:profile_teams(
        id, role, joined_at,
        profile:profiles(id, name, email)
      )
    `)
    .eq("id", id)
    .single();

  if (dbError || !data) return apiNotFound("팀");

  return apiSuccess(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, teamUpdateSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data, error: dbError } = await adminClient
    .from("teams")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("teams")
    .delete()
    .eq("id", id);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess({ deleted: true });
}
