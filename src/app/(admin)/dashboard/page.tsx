import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Upload,
} from "lucide-react";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { PROJECT_STATUS, APPLICATION_STATUS } from "@/lib/constants/status";

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function getStats() {
  const db = createAdminClient();
  const [
    { count: activeUsers },
    { count: totalUsers },
    { count: recruitingProjects },
    { count: totalProjects },
    { count: completedProjects },
    { count: cancelledProjects },
    { count: pendingApplications },
    { count: totalApplications },
    { count: publishedNotices },
    { count: availAvail },
    { count: availPartial },
    { count: availUnavail },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active"),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("projects").select("*", { count: "exact", head: true }).eq("status", "recruiting"),
    db.from("projects").select("*", { count: "exact", head: true }),
    db.from("projects").select("*", { count: "exact", head: true }).eq("status", "completed"),
    db.from("projects").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    db.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("applications").select("*", { count: "exact", head: true }),
    db.from("notices").select("*", { count: "exact", head: true }).eq("is_published", true),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active").eq("availability_status", "available"),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active").eq("availability_status", "partial"),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("account_status", "active").eq("availability_status", "unavailable"),
  ]);

  return {
    activeUsers: activeUsers ?? 0,
    totalUsers: totalUsers ?? 0,
    recruitingProjects: recruitingProjects ?? 0,
    totalProjects: totalProjects ?? 0,
    pendingApplications: pendingApplications ?? 0,
    totalApplications: totalApplications ?? 0,
    publishedNotices: publishedNotices ?? 0,
    projectStatusCounts: {
      recruiting: recruitingProjects ?? 0,
      completed: completedProjects ?? 0,
      cancelled: cancelledProjects ?? 0,
    },
    availabilityMap: {
      available: availAvail ?? 0,
      partial: availPartial ?? 0,
      unavailable: availUnavail ?? 0,
    },
  };
}

async function getFeeds() {
  const db = createAdminClient();
  const [
    recentUsersResult,
    recentApplicationsResult,
    recentAuditResult,
    recentResumesResult,
    expiringAppsResult,
  ] = await Promise.all([
    db.from("profiles")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("applications")
      .select("id, status, created_at, profiles(name), projects(title)")
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("admin_audit_logs")
      .select("id, admin_name, action, resource, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("profile_resumes")
      .select("id, file_name, file_size, created_at, profiles(id, name)")
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("applications")
      .select("freelancer_id, profiles(id, name, email), projects(id, title, duration_end_date, status)")
      .eq("status", "accepted")
      .limit(100),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ninetyDaysLater = new Date(today);
  ninetyDaysLater.setDate(today.getDate() + 90);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expiringDevs = ((expiringAppsResult.data ?? []) as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((app: any) => {
      const proj = Array.isArray(app.projects) ? app.projects[0] : app.projects;
      if (!proj?.duration_end_date || proj.status === "cancelled") return false;
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
    recentUsers: recentUsersResult.data ?? [],
    recentApplications: recentApplicationsResult.data ?? [],
    recentAuditLogs: recentAuditResult.data ?? [],
    recentResumes: recentResumesResult.data ?? [],
    expiringDevs,
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const STATUS_BAR_COLORS: Record<string, string> = {
  recruiting: "bg-blue-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-400",
};

function calcDaysLeft(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

// ── Feeds skeleton ────────────────────────────────────────────────────────────

function FeedsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-3 w-12 shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Feeds section (deferred via Suspense) ─────────────────────────────────────

async function DashboardFeeds() {
  const { recentUsers, recentApplications, recentAuditLogs, recentResumes, expiringDevs } =
    await getFeeds();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 프로젝트 종료 임박 개발자 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            프로젝트 종료 임박{" "}
            <span className="text-xs font-normal text-muted-foreground">(3개월 이내)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringDevs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              종료 임박 개발자가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {expiringDevs.map((app: any) => {
                const profile = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles;
                const proj = Array.isArray(app.projects) ? app.projects[0] : app.projects;
                const daysLeft = calcDaysLeft(proj.duration_end_date);
                const urgentClass =
                  daysLeft <= 30
                    ? "text-red-600 dark:text-red-400"
                    : daysLeft <= 60
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground";
                return (
                  <div key={app.freelancer_id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/users/${profile?.id}`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
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

      {/* 최근 가입 회원 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            최근 가입 회원
          </CardTitle>
          <Link
            href="/users"
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
          >
            전체보기 <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">가입 회원이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map(
                (user: { id: string; name: string | null; email: string | null; created_at: string }) => (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/users/${user.id}`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {user.name ?? "이름 없음"}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(user.created_at)}
                    </span>
                  </div>
                )
              )}
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
          <Link
            href="/applications"
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
          >
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
                const statusConfig =
                  APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                const profileName = Array.isArray(app.profiles)
                  ? app.profiles[0]?.name
                  : app.profiles?.name;
                const projectTitle = Array.isArray(app.projects)
                  ? app.projects[0]?.title
                  : app.projects?.title;
                return (
                  <div key={app.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/applications/${app.id}`}
                        className="text-sm font-medium hover:underline block truncate"
                      >
                        {profileName ?? "알 수 없음"}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">
                        {projectTitle ?? "알 수 없음"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          (statusConfig?.color as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline") ?? "secondary"
                        }
                        className="text-xs"
                      >
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

      {/* 최근 업로드 이력서 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            최근 업로드 이력서
          </CardTitle>
          <Link
            href="/users"
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
          >
            회원 목록 <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentResumes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              업로드된 이력서가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {recentResumes.map((resume: any) => {
                const profile = Array.isArray(resume.profiles)
                  ? resume.profiles[0]
                  : resume.profiles;
                return (
                  <div key={resume.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/users/${profile?.id}?tab=resumes`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {profile?.name ?? "알 수 없음"}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{resume.file_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(resume.created_at)}
                    </span>
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
              {recentAuditLogs.map(
                (log: {
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
                        {" "}님이 {RESOURCE_LABELS[log.resource] ?? log.resource}{" "}
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const {
    activeUsers,
    totalUsers,
    recruitingProjects,
    totalProjects,
    pendingApplications,
    totalApplications,
    publishedNotices,
    projectStatusCounts,
    availabilityMap,
  } = await getStats();

  const statCards = [
    {
      title: "활성 회원",
      value: formatCount(activeUsers),
      description: `전체 ${formatCount(totalUsers)}명`,
      icon: Users,
      href: "/users",
      accent: "text-blue-500",
    },
    {
      title: "모집중 공고",
      value: formatCount(recruitingProjects),
      description: `전체 ${formatCount(totalProjects)}건`,
      icon: FolderOpen,
      href: "/projects",
      accent: "text-emerald-500",
    },
    {
      title: "검토 대기 지원서",
      value: formatCount(pendingApplications),
      description: `전체 ${formatCount(totalApplications)}건`,
      icon: FileText,
      href: "/applications",
      accent: "text-amber-500",
    },
    {
      title: "게시중 공지",
      value: formatCount(publishedNotices),
      description: "현재 노출 중인 공지",
      icon: Bell,
      href: "/notices",
      accent: "text-purple-500",
    },
  ];

  const totalProjectsForBar = totalProjects || 1;
  const statusBarItems = Object.entries(PROJECT_STATUS).map(([key, config]) => ({
    key,
    label: config.label,
    count: projectStatusCounts[key as keyof typeof projectStatusCounts] ?? 0,
    percent: Math.round(
      ((projectStatusCounts[key as keyof typeof projectStatusCounts] ?? 0) / totalProjectsForBar) *
        100
    ),
    colorClass: STATUS_BAR_COLORS[key] ?? "bg-primary",
  }));

  return (
    <>
      <Header title="대시보드" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

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

        {/* 현황 위젯 (투입 가능 + 프로젝트 상태) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 투입 가능 현황 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                투입 가능 현황
              </CardTitle>
              <Link
                href="/users"
                className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
              >
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "available",
                  label: "투입 가능",
                  colorClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                },
                {
                  key: "partial",
                  label: "일부 가능",
                  colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                },
                {
                  key: "unavailable",
                  label: "투입 불가",
                  colorClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
                },
              ].map(({ key, label, colorClass }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {availabilityMap[key as keyof typeof availabilityMap] ?? 0}명
                  </span>
                </div>
              ))}
              {activeUsers === 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  활성 회원이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 프로젝트 상태 분포 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                프로젝트 상태 분포
              </CardTitle>
              <Link
                href="/projects"
                className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
              >
                전체보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusBarItems.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums">
                      {item.count}건{" "}
                      <span className="text-muted-foreground font-normal">({item.percent}%)</span>
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
              {totalProjects === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  등록된 프로젝트가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 피드 카드 (스트리밍) */}
        <Suspense fallback={<FeedsSkeleton />}>
          <DashboardFeeds />
        </Suspense>

      </main>
    </>
  );
}
