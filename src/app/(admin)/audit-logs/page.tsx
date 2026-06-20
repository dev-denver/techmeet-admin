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
  restore: { label: "복구", color: "default" },
  bulk_update: { label: "일괄수정", color: "secondary" },
  bulk_delete: { label: "일괄삭제", color: "destructive" },
  bulk_restore: { label: "일괄복구", color: "default" },
};

const RESOURCE_LABELS: Record<string, string> = {
  users: "사용자",
  projects: "프로젝트",
  applications: "지원서",
  notices: "공지사항",
  admins: "관리자",
  alimtalk: "문자 발송",
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
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
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
        </div>

        {/* 데스크탑/태블릿: 테이블 */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>관리자</TableHead>
                <TableHead>액션</TableHead>
                <TableHead>대상</TableHead>
                <TableHead className="hidden lg:table-cell">대상 ID</TableHead>
                <TableHead className="hidden xl:table-cell">상세</TableHead>
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
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.resource_id ? `${log.resource_id.slice(0, 8)}...` : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
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

        {/* 모바일: 카드 리스트 */}
        <div className="space-y-2 md:hidden">
          {logs.length === 0 ? (
            <EmptyState title="활동 로그가 없습니다." />
          ) : (
            logs.map((log) => {
              const actionConfig = ACTION_LABELS[log.action];
              return (
                <div key={log.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{log.admin_name}</span>
                    <Badge variant={actionConfig?.color as "default" | "secondary" | "destructive" ?? "secondary"}>
                      {actionConfig?.label ?? log.action}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {RESOURCE_LABELS[log.resource] ?? log.resource}
                    {log.resource_id && (
                      <span className="ml-1 font-mono text-xs">#{log.resource_id.slice(0, 8)}...</span>
                    )}
                  </p>
                  {log.details && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {JSON.stringify(log.details).slice(0, 50)}
                      {JSON.stringify(log.details).length > 50 ? "..." : ""}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
                </div>
              );
            })
          )}
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </main>
    </>
  );
}
