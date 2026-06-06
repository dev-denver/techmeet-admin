import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { logger } from "@/lib/observability/logger";

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, string[]>;
  };
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function apiError(
  message: string,
  status: number,
  code?: string,
  details?: Record<string, string[]>
) {
  if (status >= 500) {
    logger.error("API error", {
      status,
      code: code ?? getDefaultCode(status),
      message,
      ...(details ? { details } : {}),
    });
  }
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      error: {
        message,
        code: code ?? getDefaultCode(status),
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export function apiValidationError(error: ZodError) {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return apiError("입력값이 올바르지 않습니다.", 400, "VALIDATION_ERROR", details);
}

export function apiDbError(message: string) {
  // 원본 DB 오류는 서버 로그에만 기록하고 클라이언트에는 노출하지 않는다 (내부정보 누출 방지)
  logger.error("Database error", { detail: message });
  return apiError("데이터 처리 중 오류가 발생했습니다.", 500, "DATABASE_ERROR");
}

export function apiNotFound(resource: string) {
  return apiError(`${resource}을(를) 찾을 수 없습니다.`, 404, "NOT_FOUND");
}

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const raw = await request.json();
    const data = schema.parse(raw);
    return { data, error: null };
  } catch (e) {
    if (e instanceof ZodError) {
      return { data: null, error: apiValidationError(e) };
    }
    return { data: null, error: apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST") };
  }
}

function getDefaultCode(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 500: return "INTERNAL_ERROR";
    default: return "UNKNOWN_ERROR";
  }
}
