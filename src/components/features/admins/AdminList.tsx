"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatPhone } from "@/lib/utils/format";
import type { AdminUser } from "@/types";

interface AdminListProps {
  admins: AdminUser[];
  currentAdminId: string;
}

export function AdminList({ admins, currentAdminId }: AdminListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admins/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      const message = data.error?.message ?? "삭제에 실패했습니다.";
      setError(message);
      toast.error(message);
      return;
    }

    toast.success("관리자가 삭제되었습니다.");
    setDeleteTarget(null);
    router.refresh();
  }

  function isDeleteDisabled(admin: AdminUser) {
    if (admin.id === currentAdminId) return true;
    if (admin.role === "superadmin") return true;
    return false;
  }

  return (
    <>
      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-16 lg:table-cell">ID</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead className="hidden lg:table-cell">휴대폰번호</TableHead>
              <TableHead>역할</TableHead>
              <TableHead className="hidden lg:table-cell">등록일</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="관리자가 없습니다." />
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">#{admin.seq_id}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {admin.name}
                    {admin.id === currentAdminId && (
                      <span className="ml-2 text-xs text-muted-foreground">(본인)</span>
                    )}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatPhone(admin.phone)}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "superadmin" ? "default" : "secondary"}>
                      {admin.role === "superadmin" ? "슈퍼관리자" : "관리자"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(admin.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isDeleteDisabled(admin)}
                      onClick={() => setDeleteTarget(admin)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {admins.length === 0 ? (
          <EmptyState title="관리자가 없습니다." />
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {admin.name}
                    {admin.id === currentAdminId && (
                      <span className="ml-2 text-xs text-muted-foreground">(본인)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={admin.role === "superadmin" ? "default" : "secondary"}>
                    {admin.role === "superadmin" ? "슈퍼관리자" : "관리자"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isDeleteDisabled(admin)}
                    onClick={() => setDeleteTarget(admin)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{formatPhone(admin.phone)}</span>
                <span>{formatDate(admin.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setError(null);
          }
        }}
        title="관리자 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.${error ? `\n\n오류: ${error}` : ""}`
            : ""
        }
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
