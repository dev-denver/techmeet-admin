import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import type { ProfileListItem } from "@/types";

async function getUsers(): Promise<ProfileListItem[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("profiles")
    .select("id, name, email, phone, skills, account_status, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <>
      <Header title="사용자" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">총 {users.length}명</p>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    사용자가 없습니다.
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
      </main>
    </>
  );
}
