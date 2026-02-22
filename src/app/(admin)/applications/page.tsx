import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ApplicationsTable } from "@/components/features/applications/ApplicationsTable";
import { APPLICATION_STATUS } from "@/lib/constants/status";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

async function getApplications(params: { q?: string; status?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("applications")
    .select(`
      id, status, expected_budget, created_at,
      project:projects(id, title),
      profile:profiles(id, name, email)
    `, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { applications: data ?? [], total: count ?? 0 };
}

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { applications, total } = await getApplications(params);

  return (
    <>
      <Header title="지원서" />
      <main className="flex-1 overflow-y-auto p-6">
        <Suspense>
          <ListFilter
            searchPlaceholder="검색..."
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

        <div className="mt-4">
          <ApplicationsTable applications={applications} />
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </main>
    </>
  );
}
