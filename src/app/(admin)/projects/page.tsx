import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECT_STATUS } from "@/lib/constants/status";
import { formatDate, formatBudget } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { ProjectListItem } from "@/types";

async function getProjects(): Promise<ProjectListItem[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("projects")
    .select("id, title, status, budget_min, budget_max, start_date, category, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <Header title="프로젝트" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            총 {projects.length}개
          </p>
          <Button asChild size="sm">
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              프로젝트 등록
            </Link>
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>예산</TableHead>
                <TableHead>시작일</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    프로젝트가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => {
                  const statusConfig = PROJECT_STATUS[project.status];
                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium hover:underline"
                        >
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                          {statusConfig?.label ?? project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.category ?? "-"}</TableCell>
                      <TableCell>
                        {project.budget_min != null
                          ? `${formatBudget(project.budget_min)} ~ ${project.budget_max != null ? formatBudget(project.budget_max) : ""}`
                          : "-"}
                      </TableCell>
                      <TableCell>{formatDate(project.start_date)}</TableCell>
                      <TableCell>{formatDate(project.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
