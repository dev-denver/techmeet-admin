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
  exportType?: string;
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  statusOptions,
  bulkStatusEndpoint,
  bulkDeleteEndpoint,
  exportType,
}: BulkActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleBulkStatus(status: string) {
    if (!bulkStatusEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    await fetch(bulkStatusEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, status }),
    });
    setLoading(false);
    onClearSelection();
    router.refresh();
  }

  async function handleBulkDelete() {
    if (!bulkDeleteEndpoint || selectedIds.length === 0) return;
    setLoading(true);
    await fetch(bulkDeleteEndpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setLoading(false);
    setDeleteOpen(false);
    onClearSelection();
    router.refresh();
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
        description={`선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleBulkDelete}
        loading={loading}
      />
    </>
  );
}
