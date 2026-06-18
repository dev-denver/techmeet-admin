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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatDateTime } from "@/lib/utils/format";
import { Send } from "lucide-react";
import { AlimtalkNav } from "@/components/features/alimtalk/AlimtalkNav";
import type { AlimtalkLog } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

async function getAlimtalkLogs(params: { page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count } = await adminClient
    .from("alimtalk_logs")
    .select(`
      id, seq_id, user_id, template_code, template_name, service_type,
      send_type, is_success, sent_at, scheduled_at, error_message, created_at,
      profile:profiles(id, name, email)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { logs: (data ?? []) as any[] as AlimtalkLog[], total: count ?? 0 };
}

export default async function AlimtalkPage({ searchParams }: Props) {
  const params = await searchParams;
  const { logs, total } = await getAlimtalkLogs(params);

  return (
    <>
      <Header title="알림톡" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AlimtalkNav />
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">총 {total}건</p>
          <Button asChild size="sm" className="ml-3 shrink-0">
            <Link href="/alimtalk/send">
              <Send className="h-4 w-4 mr-2" />
              알림톡 발송
            </Link>
          </Button>
        </div>

        {/* 데스크탑/태블릿: 테이블 */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-16 lg:table-cell">ID</TableHead>
                <TableHead>템플릿</TableHead>
                <TableHead>수신자</TableHead>
                <TableHead className="hidden lg:table-cell">서비스 유형</TableHead>
                <TableHead className="hidden lg:table-cell">발송 유형</TableHead>
                <TableHead>결과</TableHead>
                <TableHead>발송일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="발송 내역이 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const profile = Array.isArray(log.profile) ? log.profile[0] : log.profile;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">#{log.seq_id}</span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{log.template_name}</p>
                        <p className="text-xs text-muted-foreground">{log.template_code}</p>
                      </TableCell>
                      <TableCell>
                        {profile ? (
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-xs text-muted-foreground">{profile.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">전체</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{log.service_type}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={log.send_type === "immediate" ? "default" : "outline"}>
                          {log.send_type === "immediate" ? "즉시" : "예약"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.is_success === null ? (
                          <Badge variant="secondary">대기</Badge>
                        ) : log.is_success ? (
                          <Badge variant="default">성공</Badge>
                        ) : (
                          <Badge variant="destructive">실패</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(log.sent_at ?? log.created_at)}</TableCell>
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
            <EmptyState title="발송 내역이 없습니다." />
          ) : (
            logs.map((log) => {
              const profile = Array.isArray(log.profile) ? log.profile[0] : log.profile;
              return (
                <div key={log.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{log.template_name}</p>
                      <p className="text-xs text-muted-foreground">{log.template_code}</p>
                    </div>
                    {log.is_success === null ? (
                      <Badge variant="secondary">대기</Badge>
                    ) : log.is_success ? (
                      <Badge variant="default">성공</Badge>
                    ) : (
                      <Badge variant="destructive">실패</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile ? `${profile.name} (${profile.email})` : "전체"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">#{log.seq_id}</span>
                    <Badge variant="outline" className="text-[10px]">{log.service_type}</Badge>
                    <span>{log.send_type === "immediate" ? "즉시" : "예약"}</span>
                    <span>{formatDateTime(log.sent_at ?? log.created_at)}</span>
                  </div>
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
