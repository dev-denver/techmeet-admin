import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FolderOpen,
  FileText,
  Bell,
  TrendingUp,
  UserPlus,
  ClipboardList,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { PROJECT_STATUS, APPLICATION_STATUS } from "@/lib/constants/status";

async function getDashboardData() {
  const adminClient = createAdminClient();

  const [
    { count: activeUserCount },
    { count: totalUserCount },
    { count: recruitingProjectCount },
    { count: totalProjectCount },
    { count: pendingApplicationCount },
    { count: totalApplicationCount },
    { count: publishedNoticeCount },
    projectStatusResult,
    recentUsersResult,
    recentApplicationsResult,
    recentAuditResult,
    availabilityResult,
    expiringAppsResult,
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("projects").select("*", { count: "exact", head: true }).eq("status", "recruiting"),
    adminClient.from("projects").select("*", { count: "exact", head: true }),
    adminClient.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    adminClient.from("applications").select("*", { count: "exact", head: true }),
    adminClient.from("notices").select("*", { count: "exact", head: true }).eq("is_published", true),
    adminClient.from("projects").select("status"),
    adminClient.from("profiles").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5),
    adminClient
      .from("applications")
      .select("id, status, created_at, profiles(name), projects(title)")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient
      .from("admin_audit_logs")
      .select("id, admin_name, action, resource, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient.from("profiles").select("availability_status").eq("account_status", "active"),
    adminClient
      .from("applications")
      .select("freelancer_id, profiles(id, name, email), projects(id, title, duration_end_date, status)")
      .eq("status", "accepted")
      .limit(100),
  ]);

  const projectStatusCounts: Record<string, number> = {};
  (projectStatusResult.data ?? []).forEach((p: { status: string }) => {
    projectStatusCounts[p.status] = (projectStatusCounts[p.status] ?? 0) + 1;
  });

  const availabilityMap: Record<string, number> = { available: 0, partial: 0, unavailable: 0 };
  (availabilityResult.data ?? []).forEach((p: { availability_status: string | null }) => {
    const s = p.availability_status;
    if (s && s in availabilityMap) availabilityMap[s]++;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysLater = new Date(today);
  ninetyDaysLater.setDate(today.getDate() + 90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expiringDevs = (expiringAppsResult.data ?? [] as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((app: any) => {
      const proj = Array.isArray(app.projects) ? app.projects[0] : app.projects;
      if (!proj?.duration_end_date || proj.status !== "in_progress") return false;
      const endDate = new Date(proj.duration_end_date);
      return endDate >= today && endDate <= ninetyDaysLater;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => {
      const aDate = Array.isArray(a.projects) ? a.projects[0]?.duration_end_date : a.projects?.duration_end_date;
      const bDate = Array.isArray(b.projects) ? b.projects[0]?.duration_end_date : b.projects?.duration_end_date;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    })
    .slice(0, 5);

  return {
    stats: {
      activeUsers: activeUserCount ?? 0,
      totalUsers: totalUserCount ?? 0,
      recruitingProjects: recruitingProjectCount ?? 0,
      totalProjects: totalProjectCount ?? 0,
      pendingApplications: pendingApplicationCount ?? 0,
      totalApplications: totalApplicationCount ?? 0,
      publishedNotices: publishedNoticeCount ?? 0,
    },
    projectStatusCounts,
    recentUsers: recentUsersResult.data ?? [],
    recentApplications: recentApplicationsResult.data ?? [],
    recentAuditLogs: recentAuditResult.data ?? [],
    availabilityMap,
    expiringDevs,
  };
}

function calcDaysLeft(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
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
  admins: "관리자",
};

// 상태별 컬러 (바 차트용)
const STATUS_BAR_COLORS: Record<string, string> = {
  recruiting: "bg-blue-500",
  in_progress: "bg-emerald-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-400",
};

export default async function DashboardPage() {
  const { stats, projectStatusCounts, recentUsers, recentApplications, recentAuditLogs, availabilityMap, expiringDevs } =
    await getDashboardData();

  const statCards = [
    {
      title: "활성 회원",
      value: formatCount(stats.activeUsers),
      description: `전체 ${formatCount(stats.totalUsers)}명`,
      icon: Users,
      href: "/users",
      accent: "text-blue-500",
    },
    {
      title: "모집중 공고",
      value: formatCount(stats.recruitingProjects),
      description: `전체 ${formatCount(stats.totalProjects)}건`,
      icon: FolderOpen,
      href: "/projects",
      accent: "text-emerald-500",
    },
    {
      title: "검토 대기 지원서",
      value: formatCount(stats.pendingApplications),
      description: `전체 ${formatCount(stats.totalApplications)}건`,
      icon: FileText,
      href: "/applications",
      accent: "text-amber-500",
    },
    {
      title: "게시중 공지",
      value: formatCount(stats.publishedNotices),
      description: "현재 노출 중인 공지",
      icon: Bell,
      href: "/notices",
      accent: "text-purple-500",
    },
  ];

  const totalProjects = stats.totalProjects || 1;
  const statusBarItems = Object.entries(PROJECT_STATUS).map(([key, config]) => ({
    key,
    label: config.label,
    count: projectStatusCounts[key] ?? 0,
    percent: Math.round(((projectStatusCounts[key] ?? 0) / totalProjects) * 100),
    colorClass: STATUS_BAR_COLORS[key] ?? "bg-primary",
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
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className={`h-4 w-4 ${card.accent}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 사용자 현황 위젯 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 투입 가능 현황 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                투입 가능 현황
              </CardTitle>
              <Link href="/users" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "available", label: "투입 가능", colorClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
                { key: "partial", label: "일부 가능", colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
                { key: "unavailable", label: "투입 불가", colorClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
              ].map(({ key, label, colorClass }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
                  <span className="text-sm font-semibold tabular-nums">{availabilityMap[key] ?? 0}명</span>
                </div>
              ))}
              {stats.activeUsers === 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">활성 회원이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 프로젝트 종료 임박 개발자 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                프로젝트 종료 임박 <span className="text-xs font-normal text-muted-foreground">(3개월 이내)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringDevs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">종료 임박 개발자가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {expiringDevs.map((app: any) => {
                    const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
                    const proj = Array.isArray(app.projects) ? app.projects[0] : app.projects;
                    const daysLeft = calcDaysLeft(proj.duration_end_date);
                    const urgentClass = daysLeft <= 30
                      ? "text-red-600 dark:text-red-400"
                      : daysLeft <= 60
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground";
                    return (
                      <div key={app.freelancer_id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/users/${profile?.id}`} className="text-sm font-medium hover:underline truncate block">
                            {profile?.name ?? "알 수 없음"}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{proj?.title}</p>
                        </div>
                        <span className={`text-xs font-semibold shrink-0 tabular-nums ${urgentClass}`}>
                          D-{daysLeft}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 메인 피드 그리드 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 프로젝트 상태 분포 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                프로젝트 상태 분포
              </CardTitle>
              <Link href="/projects" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusBarItems.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums">
                      {item.count}건 <span className="text-muted-foreground font-normal">({item.percent}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${item.colorClass}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats.totalProjects === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">등록된 프로젝트가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 최근 가입 회원 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                최근 가입 회원
              </CardTitle>
              <Link href="/users" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">가입 회원이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user: { id: string; name: string | null; email: string | null; created_at: string }) => (
                    <div key={user.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/users/${user.id}`} className="text-sm font-medium hover:underline truncate block">
                          {user.name ?? "이름 없음"}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
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
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                최근 지원서
              </CardTitle>
              <Link href="/applications" className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                전체보기 <ArrowRight className="h-3 w-3" />
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
                      <div key={app.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link href={`/applications/${app.id}`} className="text-sm font-medium hover:underline block truncate">
                            {profileName ?? "알 수 없음"}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{projectTitle ?? "알 수 없음"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"} className="text-xs">
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
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                최근 관리자 활동
              </CardTitle>
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
                    <div key={log.id} className="flex items-center justify-between gap-2">
                      <p className="text-sm min-w-0 truncate">
                        <span className="font-medium">{log.admin_name}</span>
                        <span className="text-muted-foreground">
                          {" "}님이 {RESOURCE_LABELS[log.resource] ?? log.resource}
                          {" "}{ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatRelativeTime(log.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
