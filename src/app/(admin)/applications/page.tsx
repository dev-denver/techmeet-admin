import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { ApplicationsTable } from "@/components/features/applications/ApplicationsTable";
import { ApplicationsGroupedView } from "@/components/features/applications/ApplicationsGroupedView";
import { ApplicationsViewToggle } from "@/components/features/applications/ApplicationsViewToggle";
import { APPLICATION_STATUS } from "@/lib/constants/status";

const PAGE_SIZE = 20;
const GROUP_PAGE_SIZE = 10;

interface SearchParams {
  q?: string;
  scope?: string;
  status?: string;
  view?: string;
  page?: string;
  pageSize?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

/** 검색/상태 필터를 applications 쿼리에 적용한다. 매칭 결과가 없으면 null을 반환한다. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyApplicationFilters(adminClient: ReturnType<typeof createAdminClient>, query: any, params: SearchParams) {
  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.q) {
    const scope = params.scope ?? "all";

    if (scope === "applicant") {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id")
        .or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
      const ids = profiles?.map((p) => p.id) ?? [];
      if (ids.length === 0) return null;
      query = query.in("freelancer_id", ids);

    } else if (scope === "project") {
      const { data: projects } = await adminClient
        .from("projects")
        .select("id")
        .ilike("title", `%${params.q}%`);
      const ids = projects?.map((p) => p.id) ?? [];
      if (ids.length === 0) return null;
      query = query.in("project_id", ids);

    } else {
      const [{ data: profiles }, { data: projects }] = await Promise.all([
        adminClient.from("profiles").select("id").or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`),
        adminClient.from("projects").select("id").ilike("title", `%${params.q}%`),
      ]);
      const profileIds = profiles?.map((p) => p.id) ?? [];
      const projectIds = projects?.map((p) => p.id) ?? [];

      if (profileIds.length === 0 && projectIds.length === 0) return null;
      if (profileIds.length > 0 && projectIds.length > 0) {
        query = query.or(`project_id.in.(${projectIds.join(",")}),freelancer_id.in.(${profileIds.join(",")})`);
      } else if (projectIds.length > 0) {
        query = query.in("project_id", projectIds);
      } else {
        query = query.in("freelancer_id", profileIds);
      }
    }
  }

  return query;
}

async function getApplications(params: SearchParams) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);

  const baseQuery = adminClient
    .from("applications")
    .select(`
      id, seq_id, status, expected_rate, applied_at, created_at,
      project:projects(id, title),
      profile:profiles!freelancer_id(id, name, email)
    `, { count: "exact" });

  const query = await applyApplicationFilters(adminClient, baseQuery, params);
  if (!query) return { applications: [], total: 0, pageSize };

  const { data, count } = await query
    .order("applied_at", { ascending: false })
    .range(from, to);

  return { applications: data ?? [], total: count ?? 0, pageSize };
}

async function getGroupedApplications(params: SearchParams) {
  const adminClient = createAdminClient();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * GROUP_PAGE_SIZE;
  const to = from + GROUP_PAGE_SIZE;

  const baseQuery = adminClient
    .from("applications")
    .select(`
      id, seq_id, status, expected_rate, applied_at, created_at,
      project:projects(id, title, status),
      profile:profiles!freelancer_id(id, name, email)
    `);

  const query = await applyApplicationFilters(adminClient, baseQuery, params);
  if (!query) return { groups: [], total: 0, pageSize: GROUP_PAGE_SIZE };

  const { data } = await query.order("applied_at", { ascending: false });
  const applications = data ?? [];

  // applied_at desc로 정렬된 데이터를 순서대로 묶으면, 그룹 순서 자체가
  // "가장 최근 지원이 있는 프로젝트 우선" 정렬이 된다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupMap = new Map<string, { project: any; applications: any[] }>();
  for (const app of applications) {
    const project = Array.isArray(app.project) ? app.project[0] : app.project;
    const key = project?.id ?? "unassigned";
    if (!groupMap.has(key)) {
      groupMap.set(key, { project, applications: [] });
    }
    groupMap.get(key)!.applications.push(app);
  }

  const allGroups = Array.from(groupMap.values());
  const total = allGroups.length;
  const groups = allGroups.slice(from, to);

  return { groups, total, pageSize: GROUP_PAGE_SIZE };
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === "grouped" ? "grouped" : "list";

  return (
    <>
      <Header title="지원서" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="검색..."
              searchScopes={[
                { value: "all", label: "전체" },
                { value: "project", label: "프로젝트" },
                { value: "applicant", label: "지원자" },
              ]}
              filters={[
                {
                  key: "status",
                  label: "상태",
                  options: Object.entries(APPLICATION_STATUS).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                },
              ]}
            />
          </Suspense>
          <Suspense>
            <ApplicationsViewToggle />
          </Suspense>
        </div>

        {view === "grouped" ? (
          <GroupedSection params={params} />
        ) : (
          <ListSection params={params} />
        )}
      </main>
    </>
  );
}

async function ListSection({ params }: { params: SearchParams }) {
  const { applications, total, pageSize } = await getApplications(params);

  return (
    <>
      <ApplicationsTable applications={applications} />
      <Suspense>
        <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
      </Suspense>
    </>
  );
}

async function GroupedSection({ params }: { params: SearchParams }) {
  const { groups, total, pageSize } = await getGroupedApplications(params);

  return (
    <>
      <ApplicationsGroupedView groups={groups} />
      <Suspense>
        <PaginationControls total={total} pageSize={pageSize} />
      </Suspense>
    </>
  );
}
