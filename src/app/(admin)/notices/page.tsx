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
import { parsePageParams, PAGE_SIZE_OPTIONS } from "@/lib/utils/pagination";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { NoticeListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; scope?: string; published?: string; page?: string; deleted?: string; pageSize?: string }>;
}

async function getNotices(params: { q?: string; scope?: string; published?: string; page?: string; deleted?: string; pageSize?: string }) {
  const adminClient = createAdminClient();
  const { pageSize, from, to } = parsePageParams(params, PAGE_SIZE);
  const showDeleted = params.deleted === "true";

  let query = adminClient
    .from("notices")
    .select("id, seq_id, title, is_published, is_important, notice_type, start_at, end_at, deleted_at, created_at", { count: "exact" });

  if (showDeleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (params.q) {
    const scope = params.scope ?? "all";
    if (scope === "title") {
      query = query.ilike("title", `%${params.q}%`);
    } else if (scope === "content") {
      query = query.ilike("content", `%${params.q}%`);
    } else {
      query = query.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`);
    }
  }
  if (params.published === "true") {
    query = query.eq("is_published", true);
  } else if (params.published === "false") {
    query = query.eq("is_published", false);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { notices: (data ?? []) as NoticeListItem[], total: count ?? 0, showDeleted, pageSize };
}

export default async function NoticesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { notices, total, showDeleted, pageSize } = await getNotices(params);

  return (
    <>
      <Header title="공지사항" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="검색..."
              searchScopes={[
                { value: "all", label: "제목/내용" },
                { value: "title", label: "제목" },
                { value: "content", label: "내용" },
              ]}
              filters={[
                {
                  key: "published",
                  label: "게시 상태",
                  options: [
                    { value: "true", label: "게시중" },
                    { value: "false", label: "미게시" },
                  ],
                },
                {
                  key: "deleted",
                  label: "삭제 여부",
                  options: [{ value: "true", label: "삭제된 항목" }],
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

        {showDeleted && (
          <p className="text-sm text-muted-foreground mb-3">
            삭제된 공지사항 목록입니다. 항목을 클릭하면 복구할 수 있습니다.
          </p>
        )}

        {/* 데스크탑: 테이블 */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>중요</TableHead>
                <TableHead>게시 상태</TableHead>
                <TableHead>발송 유형</TableHead>
                <TableHead>게시 기간</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="공지사항이 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">#{notice.seq_id}</span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/notices/${notice.id}`}
                        className="font-medium hover:underline"
                      >
                        {notice.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {notice.is_important && (
                        <Badge variant="destructive">중요</Badge>
                      )}
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

        {/* 모바일: 카드 리스트 */}
        <div className="space-y-2 md:hidden">
          {notices.length === 0 ? (
            <EmptyState title="공지사항이 없습니다." />
          ) : (
            notices.map((notice) => (
              <Link
                key={notice.id}
                href={`/notices/${notice.id}`}
                className="block rounded-md border p-3 active:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{notice.title}</span>
                  <div className="flex shrink-0 gap-1">
                    {notice.is_important && <Badge variant="destructive">중요</Badge>}
                    <Badge variant={notice.is_published ? "default" : "secondary"}>
                      {notice.is_published ? "게시중" : "미게시"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono">#{notice.seq_id}</span>
                  <span>{notice.notice_type === "immediate" ? "즉시" : "예약"}</span>
                  {(notice.start_at || notice.end_at) && (
                    <span>
                      {formatDate(notice.start_at)} ~ {formatDate(notice.end_at)}
                    </span>
                  )}
                  <span>{formatDate(notice.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={pageSize} pageSizeOptions={PAGE_SIZE_OPTIONS} />
        </Suspense>
      </main>
    </>
  );
}
