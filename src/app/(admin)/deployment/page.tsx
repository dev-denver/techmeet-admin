import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { DeploymentProjectsTable } from "@/components/features/deployment/DeploymentProjectsTable";
import { DeploymentProjectCreateDialog } from "@/components/features/deployment/DeploymentProjectCreateDialog";
import { DEPLOYMENT_PROJECT_STATUS, DEPLOYMENT_PROJECT_TYPE } from "@/lib/constants/status";
import type { DeploymentProject } from "@/types/deployment";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; type?: string; status?: string; deleted?: string; page?: string; pageSize?: string }>;
}

async function getProjects(params: { q?: string; type?: string; status?: string; deleted?: string; page?: string; pageSize?: string }) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);
  const showDeleted = params.deleted === "true";

  let query = adminClient
    .from("deployment_projects")
    .select("*", { count: "exact" });

  query = showDeleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.type) query = query.eq("type", params.type);
  if (params.status) query = query.eq("status", params.status);

  const { data, count } = await query
    .order("seq_id", { ascending: true })
    .range(from, to);

  return { projects: (data ?? []) as DeploymentProject[], total: count ?? 0, showDeleted, pageSize };
}

export default async function DeploymentPage({ searchParams }: Props) {
  const params = await searchParams;
  const { projects, total, showDeleted, pageSize } = await getProjects(params);

  return (
    <>
      <Header title="투입현황" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="프로젝트명 검색..."
              filters={[
                {
                  key: "type",
                  label: "구분",
                  options: Object.entries(DEPLOYMENT_PROJECT_TYPE).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                },
                {
                  key: "status",
                  label: "상태",
                  options: Object.entries(DEPLOYMENT_PROJECT_STATUS).map(([k, v]) => ({
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
          <DeploymentProjectCreateDialog />
        </div>

        {showDeleted && (
          <p className="text-sm text-muted-foreground mb-3">
            삭제된 프로젝트 목록입니다. 복구 버튼을 눌러 목록에 다시 표시할 수 있습니다.
          </p>
        )}

        <DeploymentProjectsTable projects={projects} showDeleted={showDeleted} />

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
