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
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
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
    .select("id, seq_id, name, email, phone, tech_stack, experience_years, account_status, created_at", { count: "exact" });

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  }
  if (params.status) {
    query = query.eq("account_status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { users: (data ?? []) as ProfileListItem[], total: count ?? 0, pageSize };
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { users, total, pageSize } = await getUsers(params);

  return (
    <>
      <Header title="사용자" />
      <main className="flex-1 overflow-y-auto p-6">
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
            <ExportButton type="users" />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>기술스택</TableHead>
                <TableHead className="text-center">경력(년)</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
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
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.phone ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
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
                      <TableCell className="text-center">
                        {user.experience_years != null ? `${user.experience_years}년` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        >
                          {statusConfig?.label ?? user.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
