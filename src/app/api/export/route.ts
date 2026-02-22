import { NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { apiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPORT_CONFIGS: Record<string, {
  table: string;
  select: string;
  headers: string[];
  mapRow: (row: Record<string, unknown>) => string[];
}> = {
  users: {
    table: "profiles",
    select: "id, name, email, phone, skills, career_years, account_status, created_at",
    headers: ["ID", "이름", "이메일", "연락처", "스킬", "경력(년)", "상태", "가입일"],
    mapRow: (r) => [
      String(r.id), String(r.name), String(r.email),
      String(r.phone ?? ""), (r.skills as string[])?.join(", ") ?? "",
      String(r.career_years ?? ""), String(r.account_status), String(r.created_at),
    ],
  },
  projects: {
    table: "projects",
    select: "id, title, status, budget_min, budget_max, category, start_date, end_date, created_at",
    headers: ["ID", "제목", "상태", "최소예산", "최대예산", "카테고리", "시작일", "종료일", "등록일"],
    mapRow: (r) => [
      String(r.id), String(r.title), String(r.status),
      String(r.budget_min ?? ""), String(r.budget_max ?? ""),
      String(r.category ?? ""), String(r.start_date ?? ""),
      String(r.end_date ?? ""), String(r.created_at),
    ],
  },
  applications: {
    table: "applications",
    select: "id, status, expected_budget, created_at, project:projects(title), profile:profiles(name, email)",
    headers: ["ID", "프로젝트", "지원자", "이메일", "상태", "희망예산", "지원일"],
    mapRow: (r) => {
      const project = Array.isArray(r.project) ? (r.project as Record<string, unknown>[])[0] : r.project as Record<string, unknown> | null;
      const profile = Array.isArray(r.profile) ? (r.profile as Record<string, unknown>[])[0] : r.profile as Record<string, unknown> | null;
      return [
        String(r.id), String(project?.title ?? ""),
        String(profile?.name ?? ""), String(profile?.email ?? ""),
        String(r.status), String(r.expected_budget ?? ""), String(r.created_at),
      ];
    },
  },
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || !EXPORT_CONFIGS[type]) {
    return apiError("올바른 내보내기 유형을 지정해주세요.", 400);
  }

  const config = EXPORT_CONFIGS[type];
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from(config.table)
    .select(config.select)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  const csvLines = [
    "\uFEFF" + config.headers.map(escapeCsv).join(","),
    ...rows.map((row) => config.mapRow(row).map(escapeCsv).join(",")),
  ];

  return new Response(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
