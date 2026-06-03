import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id, rid } = await params;

  const adminClient = createAdminClient();
  const { data: resume, error: fetchError } = await adminClient
    .from("profile_resumes")
    .select("file_path")
    .eq("id", rid)
    .eq("profile_id", id)
    .single();

  if (fetchError || !resume) return apiNotFound("이력서");

  const { data: signedData, error: signedError } = await adminClient.storage
    .from("resumes")
    .createSignedUrl(resume.file_path, 60);

  if (signedError || !signedData) {
    return apiError("다운로드 URL 생성에 실패했습니다.", 500, "INTERNAL_ERROR");
  }

  return apiSuccess({ url: signedData.signedUrl });
}
