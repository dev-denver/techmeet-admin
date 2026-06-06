"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface StatusOption {
  value: string;
  label: string;
}

interface BulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  statusOptions?: StatusOption[];
  bulkStatusEndpoint?: string;
  bulkDeleteEndpoint?: string;
  visibilityEndpoint?: string;
  bulkRestoreEndpoint?: string;
  exportType?: string;
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  statusOptions,
  bulkStatusEndpoint,
  bulkDeleteEndpoint,
  visibilityEndpoint,
  bulkRestoreEndpoint,
  exportType,
}: BulkActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const count = selectedIds.length;

  async function handleBulkStatus(status: string) {
    if (!bulkStatusEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    const res = await fetch(bulkStatusEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(`${count}개 항목의 상태를 변경했습니다.`);
      onClearSelection();
      router.refresh();
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  async function handleBulkVisibility(is_visible: boolean) {
    if (!visibilityEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    const res = await fetch(visibilityEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, is_visible }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(`${count}개 항목을 ${is_visible ? "노출" : "숨김"} 처리했습니다.`);
      onClearSelection();
      router.refresh();
    } else {
      toast.error("처리에 실패했습니다.");
    }
  }

  async function handleBulkDelete() {
    if (!bulkDeleteEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    const res = await fetch(bulkDeleteEndpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setLoading(false);
    setDeleteOpen(false);
    if (res.ok) {
      toast.success(`${count}개 항목을 삭제했습니다.`);
      onClearSelection();
      router.refresh();
    } else {
      toast.error("일괄 삭제에 실패했습니다.");
    }
  }

  async function handleBulkRestore() {
    if (!bulkRestoreEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    const res = await fetch(bulkRestoreEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setLoading(false);
    setRestoreOpen(false);
    if (res.ok) {
      toast.success(`${count}개 항목을 복구했습니다.`);
      onClearSelection();
      router.refresh();
    } else {
      toast.error("일괄 복구에 실패했습니다.");
    }
  }

  function handleExport() {
    if (!exportType) return;
    window.open(`/api/export?type=${exportType}`, "_blank");
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {selectedIds.length > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length}개 선택
            </span>
            {statusOptions && bulkStatusEndpoint && (
              <Select onValueChange={handleBulkStatus} disabled={loading}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="상태 변경" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {visibilityEndpoint && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkVisibility(true)}
                  disabled={loading}
                >
                  노출
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkVisibility(false)}
                  disabled={loading}
                >
                  숨김
                </Button>
              </>
            )}
            {bulkRestoreEndpoint && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRestoreOpen(true)}
                disabled={loading}
              >
                일괄 복구
              </Button>
            )}
            {bulkDeleteEndpoint && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={loading}
              >
                일괄 삭제
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              선택 해제
            </Button>
          </>
        )}
        {exportType && (
          <Button variant="outline" size="sm" onClick={handleExport} className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            CSV 내보내기
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="일괄 삭제"
        description={`선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까? 삭제된 항목은 '삭제된 항목' 필터에서 복구할 수 있습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={loading}
      />

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="일괄 복구"
        description={`선택한 ${selectedIds.length}개 항목을 복구하시겠습니까?`}
        confirmLabel="복구"
        variant="default"
        onConfirm={handleBulkRestore}
        loading={loading}
      />
    </>
  );
}
