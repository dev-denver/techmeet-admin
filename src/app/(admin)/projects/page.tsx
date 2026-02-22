import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ProjectsTable } from "@/components/features/projects/ProjectsTable";
import { PROJECT_STATUS } from "@/lib/constants/status";
import { Plus } from "lucide-react";
import type { ProjectListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

async function getProjects(params: { q?: string; status?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("projects")
    .select("id, title, status, budget_min, budget_max, start_date, category, created_at", { count: "exact" });

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { projects: (data ?? []) as ProjectListItem[], total: count ?? 0 };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { projects, total } = await getProjects(params);

  return (
    <>
      <Header title="프로젝트" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="제목, 카테고리 검색..."
              filters={[
                {
                  key: "status",
                  label: "상태",
                  options: Object.entries(PROJECT_STATUS).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
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

        <ProjectsTable projects={projects} />

        <Suspense>
          <PaginationControls total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </main>
    </>
  );
}
