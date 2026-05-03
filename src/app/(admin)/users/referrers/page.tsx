import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatDate } from "@/lib/utils/format";
import { UserCheck, Users } from "lucide-react";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

async function getReferrerStats() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("profiles")
    .select("referrer_id")
    .not("referrer_id", "is", null);

  const countMap: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    if (r.referrer_id) countMap[r.referrer_id] = (countMap[r.referrer_id] ?? 0) + 1;
  });

  const totalReferred = data?.length ?? 0;
  const uniqueReferrers = Object.keys(countMap).length;
  return { totalReferred, uniqueReferrers };
}

async function getReferredUsers(params: { q?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = adminClient
    .from("profiles")
    .select(
      `id, seq_id, name, email, created_at,
       referrer:profiles!referrer_id(id, seq_id, name, email)`,
      { count: "exact" }
    )
    .not("referrer_id", "is", null);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { users: data ?? [], total: count ?? 0 };
}

export default async function ReferrersPage({ searchParams }: Props) {
  const params = await searchParams;
  const [{ totalReferred, uniqueReferrers }, { users, total }] = await Promise.all([
    getReferrerStats(),
    getReferredUsers(params),
  ]);

  return (
    <>
      <Header title="추천인 관리" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">총 추천 가입</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalReferred}명</p>
              <p className="text-xs text-muted-foreground mt-1">추천인 코드로 가입한 사용자</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">활동 추천인</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{uniqueReferrers}명</p>
              <p className="text-xs text-muted-foreground mt-1">1명 이상 추천한 사용자</p>
            </CardContent>
          </Card>
        </div>

        {/* 필터 + 검색 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Suspense>
            <ListFilter searchPlaceholder="피추천인 이름, 이메일 검색..." filters={[]} />
          </Suspense>
          <span className="text-sm text-muted-foreground shrink-0">전체 {total}명</span>
        </div>

        {/* 테이블 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>피추천인</TableHead>
                <TableHead>피추천인 이메일</TableHead>
                <TableHead className="w-16">추천인 ID</TableHead>
                <TableHead>추천인</TableHead>
                <TableHead>추천인 이메일</TableHead>
                <TableHead>가입일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="추천 가입 내역이 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                users.map((user: any) => {
                  const referrer = Array.isArray(user.referrer) ? user.referrer[0] : user.referrer;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">#{user.seq_id}</span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                          {user.name ?? "-"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "-"}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {referrer ? `#${referrer.seq_id}` : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {referrer ? (
                          <Link href={`/users/${referrer.id}`} className="hover:underline">
                            {referrer.name ?? "-"}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{referrer?.email ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
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
