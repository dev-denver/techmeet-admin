import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { UserForm } from "@/components/features/users/UserForm";
import { UserMemoSection } from "@/components/features/users/UserMemoSection";
import { UserResumes } from "@/components/features/users/UserResumes";
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
import { APPLICATION_STATUS, PROJECT_STATUS } from "@/lib/constants/status";
import { formatDate, formatRate } from "@/lib/utils/format";
import type { Profile } from "@/types";

async function getUser(id: string): Promise<Profile | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getUserApplications(profileId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("applications")
    .select(`
      id, seq_id, status, expected_rate, applied_at, created_at,
      project:projects(id, title, status)
    `)
    .eq("freelancer_id", profileId)
    .order("applied_at", { ascending: false });
  return data ?? [];
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, applications] = await Promise.all([
    getUser(id),
    getUserApplications(id),
  ]);

  if (!user) notFound();

  return (
    <>
      <Header title="사용자 상세" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="applications">
              지원 이력 ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="resumes">이력서</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="max-w-2xl space-y-6">
            <UserForm user={user} />
            <UserMemoSection userId={id} />
          </TabsContent>

          <TabsContent value="applications">
            {/* 데스크탑/태블릿: 테이블 */}
            <div className="hidden rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden w-16 lg:table-cell">ID</TableHead>
                    <TableHead>프로젝트</TableHead>
                    <TableHead className="hidden lg:table-cell">프로젝트 상태</TableHead>
                    <TableHead>지원 상태</TableHead>
                    <TableHead className="hidden lg:table-cell">희망 단가</TableHead>
                    <TableHead>지원일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState title="지원 이력이 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => {
                      const appStatus = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                      const project = Array.isArray(app.project) ? app.project[0] : app.project;
                      const projStatus = project?.status
                        ? PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]
                        : null;
                      return (
                        <TableRow key={app.id}>
                          <TableCell className="hidden lg:table-cell">
                            <span className="font-mono text-xs text-muted-foreground">#{app.seq_id}</span>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/applications/${app.id}`}
                              className="font-medium hover:underline"
                            >
                              {project?.title ?? "-"}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {projStatus ? (
                              <Badge variant={projStatus.color as "default" | "secondary" | "destructive" | "outline"}>
                                {projStatus.label}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={appStatus?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                              {appStatus?.label ?? app.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{formatRate(app.expected_rate)}</TableCell>
                          <TableCell>{formatDate(app.applied_at ?? app.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 모바일: 카드 리스트 */}
            <div className="space-y-2 md:hidden">
              {applications.length === 0 ? (
                <EmptyState title="지원 이력이 없습니다." />
              ) : (
                applications.map((app) => {
                  const appStatus = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                  const project = Array.isArray(app.project) ? app.project[0] : app.project;
                  const projStatus = project?.status
                    ? PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS]
                    : null;
                  return (
                    <Link
                      key={app.id}
                      href={`/applications/${app.id}`}
                      className="block rounded-md border p-3 active:bg-muted/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{project?.title ?? "-"}</p>
                        <Badge variant={appStatus?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                          {appStatus?.label ?? app.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono">#{app.seq_id}</span>
                        {projStatus && (
                          <Badge variant={projStatus.color as "default" | "secondary" | "destructive" | "outline"} className="text-[10px]">
                            {projStatus.label}
                          </Badge>
                        )}
                        <span>{formatRate(app.expected_rate)}</span>
                        <span>{formatDate(app.applied_at ?? app.created_at)}</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="resumes" className="max-w-2xl">
            <UserResumes userId={id} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
