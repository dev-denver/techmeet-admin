import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel",                                           // .xls
  "text/csv",                                                            // .csv
  "application/pdf",                                                     // .pdf
  "application/msword",                                                  // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const BUCKET = "notice-files";

export async function POST(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("파일 데이터를 읽을 수 없습니다.", 400, "BAD_REQUEST");
  }

  const file = formData.get("file") as File | null;
  if (!file) return apiError("파일을 선택해주세요.", 400, "BAD_REQUEST");

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return apiError(
      "허용되지 않는 파일 형식입니다. xlsx, xls, csv, pdf, doc, docx 파일만 업로드할 수 있습니다.",
      400,
      "BAD_REQUEST"
    );
  }

  if (file.size > MAX_SIZE) {
    return apiError("파일 크기는 20MB 이하여야 합니다.", 400, "BAD_REQUEST");
  }

  const fileId = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const storageName = ext ? `${fileId}.${ext}` : fileId;
  const path = `notices/${storageName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const adminClient = createAdminClient();
  const { error: storageError } = await adminClient.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type });

  if (storageError) {
    return apiError(storageError.message, 500, "INTERNAL_ERROR");
  }

  const { data: { publicUrl } } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return apiSuccess(
    {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      path,
      uploaded_at: new Date().toISOString(),
    },
    201
  );
}

export async function DELETE(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  let body: { path?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const { path } = body;
  if (!path || typeof path !== "string") {
    return apiError("삭제할 파일 경로가 필요합니다.", 400, "BAD_REQUEST");
  }

  // Only allow paths within the notices/ prefix to prevent path traversal
  if (!path.startsWith("notices/")) {
    return apiError("잘못된 파일 경로입니다.", 400, "BAD_REQUEST");
  }

  const adminClient = createAdminClient();
  const { error: storageError } = await adminClient.storage
    .from(BUCKET)
    .remove([path]);

  if (storageError) {
    return apiError(storageError.message, 500, "INTERNAL_ERROR");
  }

  return apiSuccess({ deleted: true });
}
