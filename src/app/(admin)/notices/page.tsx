import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { NoticeListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; published?: string; page?: string }>;
}

async function getNotices(params: { q?: string; published?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("notices")
    .select("id, title, is_published, notice_type, start_at, end_at, created_at", { count: "exact" });

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`);
  }
  if (params.published === "true") {
    query = query.eq("is_published", true);
  } else if (params.published === "false") {
    query = query.eq("is_published", false);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { notices: (data ?? []) as NoticeListItem[], total: count ?? 0 };
}

export default async function NoticesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { notices, total } = await getNotices(params);

  return (
    <>
      <Header title="공지사항" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="제목 검색..."
              filters={[
                {
                  key: "published",
                  label: "게시 상태",
                  options: [
                    { value: "true", label: "게시중" },
                    { value: "false", label: "미게시" },
                  ],
                },
              ]}
            />
          </Suspense>
          <Button asChild size="sm" className="ml-3 shrink-0">
            <Link href="/notices/new">
              <Plus className="h-4 w-4 mr-2" />
              공지 등록
            </Link>
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>게시 상태</TableHead>
                <TableHead>발송 유형</TableHead>
                <TableHead>게시 기간</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState title="공지사항이 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <Link
                        href={`/notices/${notice.id}`}
                        className="font-medium hover:underline"
                      >
                        {notice.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notice.is_published ? "default" : "secondary"}>
                        {notice.is_published ? "게시중" : "미게시"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={notice.notice_type === "immediate" ? "default" : "outline"}>
                        {notice.notice_type === "immediate" ? "즉시" : "예약"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notice.start_at || notice.end_at
                        ? `${formatDate(notice.start_at)} ~ ${formatDate(notice.end_at)}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(notice.created_at)}</TableCell>
                  </TableRow>
                ))
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
