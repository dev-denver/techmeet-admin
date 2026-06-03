import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/api/audit";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  const { error, adminUser } = await verifyAdmin();
  if (error) return error;

  const { id, rid } = await params;

  const adminClient = createAdminClient();
  const { data: resume, error: fetchError } = await adminClient
    .from("profile_resumes")
    .select("id, file_path, file_name, profile_id")
    .eq("id", rid)
    .eq("profile_id", id)
    .single();

  if (fetchError || !resume) return apiNotFound("이력서");

  const { error: storageError } = await adminClient.storage
    .from("resumes")
    .remove([resume.file_path]);

  if (storageError) return apiError(storageError.message, 500, "INTERNAL_ERROR");

  const { error: dbError } = await adminClient
    .from("profile_resumes")
    .delete()
    .eq("id", rid);

  if (dbError) return apiError(dbError.message, 500, "DATABASE_ERROR");

  await logAudit({
    adminId: adminUser!.id,
    adminName: adminUser!.name,
    action: "delete",
    resource: "resumes",
    resourceId: rid,
    details: { file_name: resume.file_name, profile_id: id },
  });

  return apiSuccess({ deleted: true });
}
