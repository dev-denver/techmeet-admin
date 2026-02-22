import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { bulkStatusSchema, bulkDeleteSchema } from "@/lib/api/schemas";

export async function PATCH(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, bulkStatusSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("projects")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .in("id", body.ids);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess({ updated: body.ids.length });
}

export async function DELETE(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, bulkDeleteSchema);
  if (parseError) return parseError;

  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("projects")
    .delete()
    .in("id", body.ids);

  if (dbError) return apiDbError(dbError.message);

  return apiSuccess({ deleted: body.ids.length });
}
