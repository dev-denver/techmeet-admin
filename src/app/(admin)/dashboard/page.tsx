import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderOpen, FileText, Bell } from "lucide-react";
import { formatCount } from "@/lib/utils/format";

async function getDashboardStats() {
  const adminClient = createAdminClient();

  const [
    { count: userCount },
    { count: projectCount },
    { count: applicationCount },
    { count: noticeCount },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "active"),
    adminClient
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
    adminClient
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("notices")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true),
  ]);

  return {
    userCount: userCount ?? 0,
    projectCount: projectCount ?? 0,
    applicationCount: applicationCount ?? 0,
    noticeCount: noticeCount ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "전체 회원",
      value: formatCount(stats.userCount),
      description: "활성 프리랜서",
      icon: Users,
    },
    {
      title: "모집중 프로젝트",
      value: formatCount(stats.projectCount),
      description: "현재 모집 진행중",
      icon: FolderOpen,
    },
    {
      title: "대기 지원서",
      value: formatCount(stats.applicationCount),
      description: "검토 대기중",
      icon: FileText,
    },
    {
      title: "게시 공지사항",
      value: formatCount(stats.noticeCount),
      description: "현재 게시중",
      icon: Bell,
    },
  ];

  return (
    <>
      <Header title="대시보드" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
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
            );
          })}
        </div>
      </main>
    </>
  );
}
