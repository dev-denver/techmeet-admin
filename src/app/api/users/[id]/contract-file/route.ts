import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const FILE_COLUMNS = {
  business: "business_registration_file_path",
  bank: "bank_account_image_path",
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const type = request.nextUrl.searchParams.get("type");
  if (type !== "business" && type !== "bank") {
    return apiError("올바르지 않은 type 파라미터입니다.", 400, "INVALID_PARAM");
  }

  const { id } = await params;
  const column = FILE_COLUMNS[type];
  const adminClient = createAdminClient();

  const { data: profile, error: fetchError } = await adminClient
    .from("profiles")
    .select(column)
    .eq("id", id)
    .single();

  if (fetchError || !profile) return apiNotFound("사용자");

  const filePath = (profile as Record<string, string | null>)[column];
  if (!filePath) return apiNotFound("첨부파일");

  const { data: signedData, error: signedError } = await adminClient.storage
    .from("contract-documents")
    .createSignedUrl(filePath, 60);

  if (signedError || !signedData) {
    return apiError("다운로드 URL 생성에 실패했습니다.", 500, "INTERNAL_ERROR");
  }

  return apiSuccess({ url: signedData.signedUrl });
}
