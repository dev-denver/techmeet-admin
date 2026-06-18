import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { ProjectsTable } from "@/components/features/projects/ProjectsTable";
import { PROJECT_STATUS } from "@/lib/constants/status";
import { Plus } from "lucide-react";
import type { ProjectListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; scope?: string; status?: string; page?: string; deleted?: string; pageSize?: string }>;
}

async function getProjects(params: { q?: string; scope?: string; status?: string; page?: string; deleted?: string; pageSize?: string }) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);
  const showDeleted = params.deleted === "true";

  let query = adminClient
    .from("projects")
    .select("id, seq_id, title, description, status, duration_start_date, duration_end_date, category, business_type, is_visible, deleted_at, created_at", { count: "exact" });

  if (showDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (params.q) {
    const scope = params.scope ?? "all";
    if (scope === "title") {
      query = query.ilike("title", `%${params.q}%`);
    } else if (scope === "content") {
      query = query.ilike("description", `%${params.q}%`);
    } else {
      query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%,category.ilike.%${params.q}%`);
    }
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { projects: (data ?? []) as ProjectListItem[], total: count ?? 0, showDeleted, pageSize };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { projects, total, showDeleted, pageSize } = await getProjects(params);

  return (
    <>
      <Header title="프로젝트" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="검색..."
              searchScopes={[
                { value: "all", label: "제목/내용" },
                { value: "title", label: "제목" },
                { value: "content", label: "내용" },
              ]}
              filters={[
                {
                  key: "status",
                  label: "상태",
                  options: Object.entries(PROJECT_STATUS).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                },
                {
                  key: "deleted",
                  label: "삭제 여부",
                  options: [{ value: "true", label: "삭제된 항목" }],
                },
              ]}
            />
          </Suspense>
          <Button asChild size="sm" className="ml-3 shrink-0">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 등록
            </Link>
          </Button>
        </div>

        {showDeleted && (
          <p className="text-sm text-muted-foreground mb-3">
            삭제된 프로젝트 목록입니다. 복구 버튼을 눌러 목록에 다시 표시할 수 있습니다.
          </p>
        )}

        <ProjectsTable projects={projects} showDeleted={showDeleted} />

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
