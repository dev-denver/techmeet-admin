import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ListFilter } from "@/components/ui/list-filter";
import { formatDateTime } from "@/lib/utils/format";

const PAGE_SIZE = 30;

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "생성", color: "default" },
  update: { label: "수정", color: "secondary" },
  delete: { label: "삭제", color: "destructive" },
  bulk_update: { label: "일괄수정", color: "secondary" },
  bulk_delete: { label: "일괄삭제", color: "destructive" },
};

const RESOURCE_LABELS: Record<string, string> = {
  users: "사용자",
  projects: "프로젝트",
  applications: "지원서",
  notices: "공지사항",
  teams: "팀",
  admins: "관리자",
};

interface Props {
  searchParams: Promise<{ action?: string; resource?: string; page?: string }>;
}

async function getAuditLogs(params: { action?: string; resource?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("admin_audit_logs")
    .select("*", { count: "exact" });

  if (params.action) {
    query = query.eq("action", params.action);
  }
  if (params.resource) {
    query = query.eq("resource", params.resource);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { logs: data ?? [], total: count ?? 0 };
}

export default async function AuditLogsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { logs, total } = await getAuditLogs(params);

  return (
    <>
      <Header title="활동 로그" />
      <main className="flex-1 overflow-y-auto p-6">
        <Suspense>
          <ListFilter
            filters={[
              {
                key: "action",
                label: "액션",
                options: Object.entries(ACTION_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v.label,
                })),
              },
              {
                key: "resource",
                label: "리소스",
                options: Object.entries(RESOURCE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                })),
              },
            ]}
          />
        </Suspense>

        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>관리자</TableHead>
                <TableHead>액션</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>대상 ID</TableHead>
                <TableHead>상세</TableHead>
                <TableHead>일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState title="활동 로그가 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const actionConfig = ACTION_LABELS[log.action];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.admin_name}</TableCell>
                      <TableCell>
                        <Badge variant={actionConfig?.color as "default" | "secondary" | "destructive" ?? "secondary"}>
                          {actionConfig?.label ?? log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{RESOURCE_LABELS[log.resource] ?? log.resource}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.resource_id ? `${log.resource_id.slice(0, 8)}...` : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.details ? (
                          <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                            {JSON.stringify(log.details).slice(0, 50)}
                            {JSON.stringify(log.details).length > 50 ? "..." : ""}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </main>
    </>
  );
}
