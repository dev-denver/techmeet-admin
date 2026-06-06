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
import { Badge } from "@/components/ui/badge";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatDate } from "@/lib/utils/format";
import { UserCheck, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ReferrerGroupList,
  type ReferrerGroup,
} from "@/components/features/users/ReferrerGroupList";

const PAGE_SIZE = 20;

interface ReferredUserRow {
  id: string;
  seq_id: number;
  name: string | null;
  email: string | null;
  created_at: string;
  referrer_id: string;
  account_status: "active" | "withdrawn";
}

interface ReferrerRow {
  id: string;
  seq_id: number;
  name: string | null;
  email: string | null;
  account_status: "active" | "withdrawn";
}

interface ReferredUserWithReferrer extends ReferredUserRow {
  referrer: ReferrerRow | null;
}

interface Props {
  searchParams: Promise<{
    q?: string;
    page?: string;
    view?: string;
    by?: string;
    status?: string;
  }>;
}

// ── 그룹 뷰용: 2-step fetch (Supabase 자기참조 FK 조인 방향 문제 우회)
async function getReferrerGroups(): Promise<ReferrerGroup[]> {
  const adminClient = createAdminClient();

  const { data: referredUsers } = await adminClient
    .from("profiles")
    .select("id, seq_id, name, email, created_at, referrer_id, account_status")
    .not("referrer_id", "is", null)
    .order("created_at", { ascending: true });

  if (!referredUsers?.length) return [];

  const referrerIds = [...new Set(referredUsers.map((u) => u.referrer_id as string))];
  const { data: referrers } = await adminClient
    .from("profiles")
    .select("id, seq_id, name, email, account_status")
    .in("id", referrerIds);

  if (!referrers?.length) return [];

  const referrerMap = new Map(referrers.map((r) => [r.id, r]));
  const groupsMap = new Map<string, ReferrerGroup>();

  for (const user of referredUsers) {
    const referrer = referrerMap.get(user.referrer_id as string);
    if (!referrer) continue;
    if (!groupsMap.has(referrer.id)) {
      groupsMap.set(referrer.id, {
        referrer: {
          id: referrer.id,
          seq_id: referrer.seq_id,
          name: referrer.name,
          email: referrer.email,
          avatar_url: null,
          account_status: referrer.account_status as "active" | "withdrawn",
        },
        referees: [],
      });
    }
    groupsMap.get(referrer.id)!.referees.push({
      id: user.id,
      seq_id: user.seq_id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      account_status: user.account_status as "active" | "withdrawn",
    });
  }

  return Array.from(groupsMap.values()).sort(
    (a, b) => b.referees.length - a.referees.length
  );
}

// 그룹 뷰 서버사이드 필터링
function filterGroups(
  groups: ReferrerGroup[],
  q: string | undefined,
  by: string | undefined,
  status: string | undefined
): ReferrerGroup[] {
  let result = groups;

  // 탈퇴 필터
  if (status === "active") {
    result = result
      .filter((g) => g.referrer.account_status === "active")
      .map((g) => ({
        ...g,
        referees: g.referees.filter((r) => r.account_status === "active"),
      }))
      .filter((g) => g.referees.length > 0);
  }

  // 검색 필터
  if (!q) return result;
  const lower = q.toLowerCase();

  return result
    .map((group) => {
      const referrerMatch =
        group.referrer.name?.toLowerCase().includes(lower) ||
        group.referrer.email?.toLowerCase().includes(lower);
      const matchedReferees = group.referees.filter(
        (r) =>
          r.name?.toLowerCase().includes(lower) ||
          r.email?.toLowerCase().includes(lower)
      );

      if (by === "referrer") return referrerMatch ? group : null;
      if (by === "referee")
        return matchedReferees.length
          ? { ...group, referees: matchedReferees }
          : null;
      // 기본(전체): 추천인 or 피추천인 중 하나라도 매칭
      if (referrerMatch) return group;
      if (matchedReferees.length) return { ...group, referees: matchedReferees };
      return null;
    })
    .filter(Boolean) as ReferrerGroup[];
}

// ── 목록 뷰용: 2-step fetch + 페이지네이션
async function getReferredUsers(params: {
  q?: string;
  page?: string;
  status?: string;
}): Promise<{ users: ReferredUserWithReferrer[]; total: number }> {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Supabase 쿼리 빌더는 조건부 재할당 시 타입이 좁혀지지 않아 빌더만 any로 둔다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = adminClient
    .from("profiles")
    .select("id, seq_id, name, email, created_at, referrer_id, account_status", {
      count: "exact",
    })
    .not("referrer_id", "is", null);

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,email.ilike.%${params.q}%`);
  }
  if (params.status === "active") {
    query = query.eq("account_status", "active");
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const referredUsers = (data ?? []) as ReferredUserRow[];
  if (!referredUsers.length) return { users: [], total: count ?? 0 };

  const referrerIds = [...new Set(referredUsers.map((u) => u.referrer_id))];
  const { data: referrers } = await adminClient
    .from("profiles")
    .select("id, seq_id, name, email, account_status")
    .in("id", referrerIds);

  const referrerMap = new Map<string, ReferrerRow>(
    ((referrers ?? []) as ReferrerRow[]).map((r) => [r.id, r])
  );

  const users: ReferredUserWithReferrer[] = referredUsers.map((user) => ({
    ...user,
    referrer: referrerMap.get(user.referrer_id) ?? null,
  }));

  return { users, total: count ?? 0 };
}

const GROUP_SEARCH_FILTERS = [
  {
    key: "by",
    label: "검색 기준",
    defaultLabel: "전체",
    options: [
      { value: "referrer", label: "추천인 기준" },
      { value: "referee", label: "피추천인 기준" },
    ],
  },
  {
    key: "status",
    label: "상태",
    defaultLabel: "전체",
    options: [{ value: "active", label: "활성만" }],
  },
];

const LIST_SEARCH_FILTERS = [
  {
    key: "status",
    label: "상태",
    defaultLabel: "전체",
    options: [{ value: "active", label: "활성만" }],
  },
];

export default async function ReferrersPage({ searchParams }: Props) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "group";

  const [groups, { users, total }] = await Promise.all([
    getReferrerGroups(),
    view === "list"
      ? getReferredUsers(params)
      : Promise.resolve({ users: [] as ReferredUserWithReferrer[], total: 0 }),
  ]);

  const filteredGroups = filterGroups(groups, params.q, params.by, params.status);
  const filteredRefereeCount = filteredGroups.reduce(
    (sum, g) => sum + g.referees.length,
    0
  );

  // 통계는 필터 전 전체 기준
  const totalReferred = groups.reduce((sum, g) => sum + g.referees.length, 0);
  const uniqueReferrers = groups.length;
  const avgPerReferrer =
    uniqueReferrers > 0 ? (totalReferred / uniqueReferrers).toFixed(1) : "0";

  return (
    <>
      <Header title="추천인 관리" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* 통계 카드 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 추천 가입
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalReferred}명</p>
              <p className="text-xs text-muted-foreground mt-1">
                추천인 코드로 가입한 사용자
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                활동 추천인
              </CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{uniqueReferrers}명</p>
              <p className="text-xs text-muted-foreground mt-1">
                1명 이상 추천한 사용자
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                추천인당 평균
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgPerReferrer}명</p>
              <p className="text-xs text-muted-foreground mt-1">
                추천인 1인당 평균 추천 인원
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 뷰 탭 */}
        <div className="flex gap-0 border-b">
          <Link
            href="/users/referrers?view=group"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              view === "group"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            그룹 뷰
          </Link>
          <Link
            href="/users/referrers?view=list"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              view === "list"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            목록 뷰
          </Link>
        </div>

        {view === "group" ? (
          <>
            {/* 그룹 뷰 검색 + 필터 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Suspense>
                <ListFilter
                  searchPlaceholder="추천인 또는 피추천인 검색..."
                  filters={GROUP_SEARCH_FILTERS}
                />
              </Suspense>
              <span className="text-sm text-muted-foreground shrink-0">
                {filteredGroups.length}개 그룹 · {filteredRefereeCount}명
              </span>
            </div>
            <ReferrerGroupList
              groups={filteredGroups}
              emptyMessage={
                params.q || params.status
                  ? "검색 결과가 없습니다."
                  : "추천 관계가 없습니다."
              }
            />
          </>
        ) : (
          <>
            {/* 목록 뷰 검색 + 필터 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Suspense>
                <ListFilter
                  searchPlaceholder="피추천인 이름, 이메일 검색..."
                  filters={LIST_SEARCH_FILTERS}
                />
              </Suspense>
              <span className="text-sm text-muted-foreground shrink-0">
                전체 {total}명
              </span>
            </div>

            {/* 목록 테이블 */}
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
                    users.map((user) => {
                      const referrer = user.referrer ?? null;
                      const userWithdrawn = user.account_status === "withdrawn";
                      const referrerWithdrawn =
                        referrer?.account_status === "withdrawn";
                      return (
                        <TableRow
                          key={user.id}
                          className={userWithdrawn ? "opacity-60" : undefined}
                        >
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              #{user.seq_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/users/${user.id}`}
                                className={cn(
                                  "font-medium hover:underline",
                                  userWithdrawn &&
                                    "line-through text-muted-foreground"
                                )}
                              >
                                {user.name ?? "-"}
                              </Link>
                              {userWithdrawn && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-muted-foreground h-4 px-1 py-0 leading-none"
                                >
                                  탈퇴
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email ?? "-"}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-muted-foreground">
                              {referrer ? `#${referrer.seq_id}` : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {referrer ? (
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/users/${referrer.id}`}
                                  className={cn(
                                    "hover:underline",
                                    referrerWithdrawn &&
                                      "line-through text-muted-foreground"
                                  )}
                                >
                                  {referrer.name ?? "-"}
                                </Link>
                                {referrerWithdrawn && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-muted-foreground h-4 px-1 py-0 leading-none"
                                  >
                                    탈퇴
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {referrer?.email ?? "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
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
          </>
        )}
      </main>
    </>
  );
}
