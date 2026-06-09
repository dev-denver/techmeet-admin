import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { ApplicationsTable } from "@/components/features/applications/ApplicationsTable";
import { APPLICATION_STATUS } from "@/lib/constants/status";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; scope?: string; status?: string; page?: string; pageSize?: string }>;
}

async function getApplications(params: { q?: string; scope?: string; status?: string; page?: string; pageSize?: string }) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);

  let query = adminClient
    .from("applications")
    .select(`
      id, seq_id, status, expected_rate, applied_at, created_at,
      project:projects(id, title),
      profile:profiles!freelancer_id(id, name, email)
    `, { count: "exact" });

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
      if (ids.length === 0) return { applications: [], total: 0, pageSize };
      query = query.in("freelancer_id", ids);

    } else if (scope === "project") {
      const { data: projects } = await adminClient
        .from("projects")
        .select("id")
        .ilike("title", `%${params.q}%`);
      const ids = projects?.map((p) => p.id) ?? [];
      if (ids.length === 0) return { applications: [], total: 0, pageSize };
      query = query.in("project_id", ids);

    } else {
      const [{ data: profiles }, { data: projects }] = await Promise.all([
        adminClient.from("profiles").select("id").or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`),
        adminClient.from("projects").select("id").ilike("title", `%${params.q}%`),
      ]);
      const profileIds = profiles?.map((p) => p.id) ?? [];
      const projectIds = projects?.map((p) => p.id) ?? [];

      if (profileIds.length === 0 && projectIds.length === 0) {
        return { applications: [], total: 0, pageSize };
      }
      if (profileIds.length > 0 && projectIds.length > 0) {
        query = query.or(`project_id.in.(${projectIds.join(",")}),freelancer_id.in.(${profileIds.join(",")})`);
      } else if (projectIds.length > 0) {
        query = query.in("project_id", projectIds);
      } else {
        query = query.in("freelancer_id", profileIds);
      }
    }
  }

  const { data, count } = await query
    .order("applied_at", { ascending: false })
    .range(from, to);

  return { applications: data ?? [], total: count ?? 0, pageSize };
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { applications, total, pageSize } = await getApplications(params);

  return (
    <>
      <Header title="지원서" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
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
        </div>

        <ApplicationsTable applications={applications} />

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
