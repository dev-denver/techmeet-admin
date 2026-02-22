import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { UserForm } from "@/components/features/users/UserForm";
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
import { APPLICATION_STATUS, PROJECT_STATUS, TEAM_ROLE } from "@/lib/constants/status";
import { formatDate, formatBudget } from "@/lib/utils/format";
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
      id, status, expected_budget, created_at,
      project:projects(id, title, status)
    `)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function getUserTeams(profileId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("profile_teams")
    .select(`
      id, role, joined_at,
      team:teams(id, name)
    `)
    .eq("profile_id", profileId)
    .order("joined_at", { ascending: false });
  return data ?? [];
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, applications, teams] = await Promise.all([
    getUser(id),
    getUserApplications(id),
    getUserTeams(id),
  ]);

  if (!user) notFound();

  return (
    <>
      <Header title="사용자 상세" />
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList>
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="applications">
              지원 이력 ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="teams">
              소속 팀 ({teams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="max-w-2xl">
            <UserForm user={user} />
          </TabsContent>

          <TabsContent value="applications">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프로젝트</TableHead>
                    <TableHead>프로젝트 상태</TableHead>
                    <TableHead>지원 상태</TableHead>
                    <TableHead>희망 예산</TableHead>
                    <TableHead>지원일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
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
                          <TableCell>
                            <Link
                              href={`/applications/${app.id}`}
                              className="font-medium hover:underline"
                            >
                              {project?.title ?? "-"}
                            </Link>
                          </TableCell>
                          <TableCell>
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

          <TabsContent value="teams">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>팀</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>가입일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <EmptyState title="소속 팀이 없습니다." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    teams.map((pt) => {
                      const team = Array.isArray(pt.team) ? pt.team[0] : pt.team;
                      const roleConfig = TEAM_ROLE[pt.role as keyof typeof TEAM_ROLE];
                      return (
                        <TableRow key={pt.id}>
                          <TableCell>
                            <Link
                              href={`/teams/${team?.id}`}
                              className="font-medium hover:underline"
                            >
                              {team?.name ?? "-"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleConfig?.color as "default" | "secondary"}>
                              {roleConfig?.label ?? pt.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(pt.joined_at)}</TableCell>
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
