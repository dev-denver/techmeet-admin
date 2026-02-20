import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { NoticeListItem } from "@/types";

async function getNotices(): Promise<NoticeListItem[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("notices")
    .select("id, title, is_published, notice_type, start_at, end_at, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function NoticesPage() {
  const notices = await getNotices();

  return (
    <>
      <Header title="공지사항" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">총 {notices.length}건</p>
          <Button asChild size="sm">
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    공지사항이 없습니다.
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
      </main>
    </>
  );
}
