import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ProjectForm } from "@/components/features/projects/ProjectForm";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APPLICATION_STATUS } from "@/lib/constants/status";
import { formatDate, formatBudget } from "@/lib/utils/format";
import type { Project } from "@/types";

async function getProject(id: string): Promise<Project | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getProjectApplications(projectId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("applications")
    .select(`
      id, status, expected_budget, created_at,
      profile:profiles(id, name, email)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, applications] = await Promise.all([
    getProject(id),
    getProjectApplications(id),
  ]);

  if (!project) notFound();

  return (
    <>
      <Header title="프로젝트 상세" />
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="applications">
              지원자 ({applications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="max-w-2xl">
            <ProjectForm project={project} />
          </TabsContent>

          <TabsContent value="applications">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지원자</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>희망 예산</TableHead>
                    <TableHead>지원일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState title="지원자가 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => {
                      const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                      const profile = Array.isArray(app.profile) ? app.profile[0] : app.profile;
                      return (
                        <TableRow key={app.id}>
                          <TableCell>
                            <Link
                              href={`/applications/${app.id}`}
                              className="font-medium hover:underline"
                            >
                              {profile?.name ?? "-"}
                            </Link>
                          </TableCell>
                          <TableCell>{profile?.email ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                              {statusConfig?.label ?? app.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatBudget(app.expected_budget)}</TableCell>
                          <TableCell>{formatDate(app.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
