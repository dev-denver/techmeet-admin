import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { teamCreateSchema } from "@/lib/api/schemas";

export async function GET() {
  const { error } = await verifyAdmin();
  if (error) return error;

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
    .order("created_at", { ascending: false });

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data);
}

export async function POST(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, teamCreateSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("teams")
    .insert(body)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess(data, 201);
}
