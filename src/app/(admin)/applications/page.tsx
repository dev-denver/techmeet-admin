import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APPLICATION_STATUS } from "@/lib/constants/status";
import { formatDate, formatBudget } from "@/lib/utils/format";

async function getApplications() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("applications")
    .select(`
      id, status, expected_budget, created_at,
      project:projects(id, title),
      profile:profiles(id, name, email)
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <>
      <Header title="지원서" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            총 {applications.length}건
          </p>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>프로젝트</TableHead>
                <TableHead>지원자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>희망 예산</TableHead>
                <TableHead>지원일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    지원서가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => {
                  const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                  const project = Array.isArray(app.project) ? app.project[0] : app.project;
                  const profile = Array.isArray(app.profile) ? app.profile[0] : app.profile;
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
                        <div>
                          <p className="font-medium">{profile?.name ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        >
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
      </main>
    </>
  );
}
