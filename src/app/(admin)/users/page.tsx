import Link from "next/link";
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
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { ExportButton } from "@/components/ui/export-button";
import { UserMemoDialog } from "@/components/features/users/UserMemoDialog";
import { UserCreateDialog } from "@/components/features/users/UserCreateDialog";
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import { NotebookPen } from "lucide-react";
import type { ProfileListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string }>;
}

async function getUsers(params: { q?: string; status?: string; page?: string; pageSize?: string }) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);

  let query = adminClient
    .from("profiles")
    .select("id, seq_id, name, email, phone, tech_stack, account_status, created_at, user_admin_memos(memo)", { count: "exact" });

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  }
  if (params.status) {
    query = query.eq("account_status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const rawUsers = data ?? [];
  const userIds = rawUsers.map((u: any) => u.id); // eslint-disable-line @typescript-eslint/no-explicit-any

  const { data: acceptedApps } = userIds.length > 0
    ? await adminClient
        .from("applications")
        .select("freelancer_id, applied_at, project:projects(title)")
        .eq("status", "accepted")
        .in("freelancer_id", userIds)
        .order("applied_at", { ascending: false })
    : { data: [] };

  const latestProjectMap = new Map<string, string>();
  acceptedApps?.forEach((app: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!latestProjectMap.has(app.freelancer_id)) {
      const title = Array.isArray(app.project) ? app.project[0]?.title : app.project?.title;
      if (title) latestProjectMap.set(app.freelancer_id, title);
    }
  });

  const users = rawUsers.map((u: any) => ({  // eslint-disable-line @typescript-eslint/no-explicit-any
    ...u,
    admin_memo: Array.isArray(u.user_admin_memos) && u.user_admin_memos.length > 0
      ? (u.user_admin_memos[0] as { memo: string }).memo
      : null,
    project_count: latestProjectMap.get(u.id) ?? null,
  })) as ProfileListItem[];
  return { users, total: count ?? 0, pageSize };
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { users, total, pageSize } = await getUsers(params);

  return (
    <>
      <Header title="사용자" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <Suspense>
            <ListFilter
              searchPlaceholder="이름, 이메일, 연락처 검색..."
              filters={[
                {
                  key: "status",
                  label: "상태",
                  options: Object.entries(ACCOUNT_STATUS).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  })),
                },
              ]}
            />
          </Suspense>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-muted-foreground">전체 {total}명</span>
            <UserCreateDialog />
            <ExportButton type="users" />
          </div>
        </div>

        {/* 데스크탑: 테이블 */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">ID</TableHead>
                <TableHead className="w-32">이름</TableHead>
                <TableHead className="hidden w-36 lg:table-cell">전화번호</TableHead>
                <TableHead className="hidden w-52 xl:table-cell">기술스택</TableHead>
                <TableHead className="hidden w-44 lg:table-cell">투입 프로젝트</TableHead>
                <TableHead className="w-24">상태</TableHead>
                <TableHead className="w-28">가입일</TableHead>
                <TableHead className="w-12 text-center">메모</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState title="등록된 개발자가 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const statusConfig = ACCOUNT_STATUS[user.account_status];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">#{user.seq_id}</span>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{user.phone ?? "-"}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {user.tech_stack?.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="text-xs bg-muted rounded px-1.5 py-0.5">{skill}</span>
                          ))}
                          {user.tech_stack?.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{user.tech_stack.length - 3}</span>
                          )}
                          {(!user.tech_stack || user.tech_stack.length === 0) && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-0 truncate text-muted-foreground lg:table-cell">
                        <span className="block truncate">{user.project_count ?? "-"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        >
                          {statusConfig?.label ?? user.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <UserMemoDialog
                          userId={user.id}
                          userName={user.name}
                          initialMemo={user.admin_memo ?? null}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="space-y-2 md:hidden">
          {users.length === 0 ? (
            <EmptyState title="등록된 개발자가 없습니다." />
          ) : (
            users.map((user) => {
              const statusConfig = ACCOUNT_STATUS[user.account_status];
              return (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="block rounded-md border p-3 active:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{user.name}</span>
                    <Badge
                      variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                    >
                      {statusConfig?.label ?? user.account_status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">#{user.seq_id}</span>
                    <span>{user.phone ?? "-"}</span>
                    {user.project_count && <span>{user.project_count}</span>}
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  {user.tech_stack && user.tech_stack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.tech_stack.slice(0, 4).map((skill: string) => (
                        <span key={skill} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {skill}
                        </span>
                      ))}
                      {user.tech_stack.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                          +{user.tech_stack.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  {user.admin_memo && user.admin_memo.trim() && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <NotebookPen className="h-3 w-3" />
                      <span>메모 있음</span>
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
