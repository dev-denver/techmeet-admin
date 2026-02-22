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
import { ExportButton } from "@/components/ui/export-button";
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import type { ProfileListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

async function getUsers(params: { q?: string; status?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("profiles")
    .select("id, name, email, phone, skills, account_status, created_at", { count: "exact" });

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`);
  }
  if (params.status) {
    query = query.eq("account_status", params.status);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { users: (data ?? []) as ProfileListItem[], total: count ?? 0 };
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const { users, total } = await getUsers(params);

  return (
    <>
      <Header title="사용자" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
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
          <ExportButton type="users" />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>스킬</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState title="사용자가 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const statusConfig = ACCOUNT_STATUS[user.account_status];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium hover:underline"
                        >
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ?? "-"}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.skills?.slice(0, 3).join(", ")}
                          {user.skills?.length > 3 && ` +${user.skills.length - 3}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        >
                          {statusConfig?.label ?? user.account_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
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
