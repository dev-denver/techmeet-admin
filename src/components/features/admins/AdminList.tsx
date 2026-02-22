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
import { formatDate } from "@/lib/utils/format";
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

  const superadminCount = admins.filter((a) => a.role === "superadmin").length;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/admins/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "삭제에 실패했습니다.");
      return;
    }

    setDeleteTarget(null);
    router.refresh();
  }

  function isDeleteDisabled(admin: AdminUser) {
    if (admin.id === currentAdminId) return true;
    if (admin.role === "superadmin" && superadminCount <= 1) return true;
    return false;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState title="관리자가 없습니다." />
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.name}
                    {admin.id === currentAdminId && (
                      <span className="ml-2 text-xs text-muted-foreground">(본인)</span>
                    )}
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.role === "superadmin" ? "default" : "secondary"}>
                      {admin.role === "superadmin" ? "슈퍼관리자" : "관리자"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(admin.created_at)}</TableCell>
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
