import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiDbError, apiNotFound, parseBody } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { noticeUpdateSchema } from "@/lib/api/schemas";
import { logAudit } from "@/lib/api/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("notices")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) return apiNotFound("공지사항");

  return apiSuccess(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { data: body, error: parseError } = await parseBody(request, noticeUpdateSchema);
  if (parseError) return parseError;

  const { id } = await params;
  const adminClient = createAdminClient();

  // Remove storage files that were deleted from the attachment list
  if (body.attachments !== undefined) {
    const { data: existing } = await adminClient
      .from("notices")
      .select("attachments")
      .eq("id", id)
      .single();

    if (existing?.attachments) {
      type AttachmentRow = { path: string };
      const oldPaths = (existing.attachments as AttachmentRow[]).map((a) => a.path);
      const newPaths = (body.attachments as AttachmentRow[]).map((a) => a.path);
      const removedPaths = oldPaths.filter((p) => !newPaths.includes(p));
      if (removedPaths.length > 0) {
        await adminClient.storage.from("notice-files").remove(removedPaths);
      }
    }
  }

  const { data, error: dbError } = await adminClient
    .from("notices")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "update",
    resource: "notices",
    resourceId: id,
    details: body as Record<string, unknown>,
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
    .from("notices")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (dbError) return apiDbError(dbError.message);

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "notices",
    resourceId: id,
  });

  return apiSuccess({ deleted: true });
}
