import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  FolderOpen,
  FileText,
  Bell,
  TrendingUp,
  UserPlus,
  ClipboardList,
  UsersRound,
} from "lucide-react";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { PROJECT_STATUS, APPLICATION_STATUS } from "@/lib/constants/status";

async function getDashboardData() {
  const adminClient = createAdminClient();

  const [
    { count: activeUserCount },
    { count: totalUserCount },
    { count: openProjectCount },
    { count: totalProjectCount },
    { count: pendingApplicationCount },
    { count: totalApplicationCount },
    { count: publishedNoticeCount },
    { count: teamCount },
    projectStatusResult,
    recentUsersResult,
    recentApplicationsResult,
    recentAuditResult,
  ] = await Promise.all([
    // 기본 통계
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("projects").select("*", { count: "exact", head: true }).eq("status", "open"),
    adminClient.from("projects").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("applications").select("*", { count: "exact", head: true }),
    adminClient.from("notices").select("*", { count: "exact", head: true }).eq("is_published", true),
    adminClient.from("teams").select("*", { count: "exact", head: true }),
    // 프로젝트 상태 분포
    adminClient.from("projects").select("status"),
    // 최근 가입 회원
    adminClient.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5),
    // 최근 지원서
    adminClient.from("applications").select("id, status, created_at, profiles(name), projects(title)").order("created_at", { ascending: false }).limit(5),
    // 최근 활동 로그
    adminClient.from("admin_audit_logs").select("id, admin_name, action, resource, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  // 프로젝트 상태별 개수 계산
  const projectStatusCounts: Record<string, number> = {};
  (projectStatusResult.data ?? []).forEach((p: { status: string }) => {
    projectStatusCounts[p.status] = (projectStatusCounts[p.status] ?? 0) + 1;
  });

  return {
    stats: {
      activeUsers: activeUserCount ?? 0,
      totalUsers: totalUserCount ?? 0,
      openProjects: openProjectCount ?? 0,
      totalProjects: totalProjectCount ?? 0,
      pendingApplications: pendingApplicationCount ?? 0,
      totalApplications: totalApplicationCount ?? 0,
      publishedNotices: publishedNoticeCount ?? 0,
      teams: teamCount ?? 0,
    },
    projectStatusCounts,
    recentUsers: recentUsersResult.data ?? [],
    recentApplications: recentApplicationsResult.data ?? [],
    recentAuditLogs: recentAuditResult.data ?? [],
  };
}

const ACTION_LABELS: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  bulk_update: "일괄수정",
  bulk_delete: "일괄삭제",
};

const RESOURCE_LABELS: Record<string, string> = {
  users: "사용자",
  projects: "프로젝트",
  applications: "지원서",
  notices: "공지사항",
  teams: "팀",
  admins: "관리자",
};

export default async function DashboardPage() {
  const { stats, projectStatusCounts, recentUsers, recentApplications, recentAuditLogs } =
    await getDashboardData();

  const statCards = [
    {
      title: "활성 회원",
      value: formatCount(stats.activeUsers),
      description: `전체 ${formatCount(stats.totalUsers)}명`,
      icon: Users,
      href: "/users",
    },
    {
      title: "모집중 프로젝트",
      value: formatCount(stats.openProjects),
      description: `전체 ${formatCount(stats.totalProjects)}건`,
      icon: FolderOpen,
      href: "/projects",
    },
    {
      title: "대기 지원서",
      value: formatCount(stats.pendingApplications),
      description: `전체 ${formatCount(stats.totalApplications)}건`,
      icon: FileText,
      href: "/applications",
    },
    {
      title: "팀",
      value: formatCount(stats.teams),
      description: "등록된 팀",
      icon: UsersRound,
      href: "/teams",
    },
  ];

  // 프로젝트 상태 분포 바 차트용 데이터
  const totalProjects = stats.totalProjects || 1;
  const statusBarItems = Object.entries(PROJECT_STATUS).map(([key, config]) => ({
    key,
    label: config.label,
    count: projectStatusCounts[key] ?? 0,
    percent: Math.round(((projectStatusCounts[key] ?? 0) / totalProjects) * 100),
  }));

  return (
    <>
      <Header title="대시보드" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 프로젝트 상태 분포 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  프로젝트 상태 분포
                </span>
              </CardTitle>
              <Link href="/projects" className="text-xs text-muted-foreground hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusBarItems.map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.count}건 ({item.percent}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 최근 가입 회원 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  최근 가입 회원
                </span>
              </CardTitle>
              <Link href="/users" className="text-xs text-muted-foreground hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">가입 회원이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user: { id: string; name: string | null; email: string | null; created_at: string }) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <Link href={`/users/${user.id}`} className="text-sm font-medium hover:underline truncate block">
                          {user.name ?? "이름 없음"}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatRelativeTime(user.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 지원서 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  최근 지원서
                </span>
              </CardTitle>
              <Link href="/applications" className="text-xs text-muted-foreground hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">지원서가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentApplications.map((app: any) => {
                    const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                    const profileName = Array.isArray(app.profiles) ? app.profiles[0]?.name : app.profiles?.name;
                    const projectTitle = Array.isArray(app.projects) ? app.projects[0]?.title : app.projects?.title;
                    return (
                      <div key={app.id} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <Link href={`/applications/${app.id}`} className="text-sm font-medium hover:underline truncate block">
                            {profileName ?? "알 수 없음"} → {projectTitle ?? "알 수 없음"}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                            {statusConfig?.label ?? app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(app.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 관리자 활동 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  최근 관리자 활동
                </span>
              </CardTitle>
              <Link href="/audit-logs" className="text-xs text-muted-foreground hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              {recentAuditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">활동 로그가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {recentAuditLogs.map((log: {
                    id: string;
                    admin_name: string;
                    action: string;
                    resource: string;
                    created_at: string;
                  }) => (
                    <div key={log.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.admin_name}</span>
                          <span className="text-muted-foreground">
                            {" "}님이 {RESOURCE_LABELS[log.resource] ?? log.resource}을(를) {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatRelativeTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 공지사항 요약 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                현재 게시중 공지 {formatCount(stats.publishedNotices)}건
              </span>
            </CardTitle>
            <Link href="/notices" className="text-xs text-muted-foreground hover:underline">
              공지사항 관리
            </Link>
          </CardHeader>
        </Card>
      </main>
    </>
  );
}
