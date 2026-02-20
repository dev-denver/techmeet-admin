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
import { formatDateTime } from "@/lib/utils/format";
import { Send } from "lucide-react";
import type { AlimtalkLog } from "@/types";

async function getAlimtalkLogs(): Promise<AlimtalkLog[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("alimtalk_logs")
    .select(`
      id, user_id, template_code, template_name, service_type,
      send_type, is_success, sent_at, scheduled_at, error_message, created_at,
      profile:profiles(id, name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

export default async function AlimtalkPage() {
  const logs = await getAlimtalkLogs();

  return (
    <>
      <Header title="알림톡" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">최근 {logs.length}건</p>
          <Button asChild size="sm">
            <Link href="/alimtalk/send">
              <Send className="h-4 w-4 mr-2" />
              알림톡 발송
            </Link>
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>템플릿</TableHead>
                <TableHead>수신자</TableHead>
                <TableHead>서비스 유형</TableHead>
                <TableHead>발송 유형</TableHead>
                <TableHead>결과</TableHead>
                <TableHead>발송일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    발송 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const profile = Array.isArray(log.profile) ? log.profile[0] : log.profile;
                  return (
                    <TableRow key={log.id}>
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
                      <TableCell>
                        <Badge variant="outline">{log.service_type}</Badge>
                      </TableCell>
                      <TableCell>
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
      </main>
    </>
  );
}
