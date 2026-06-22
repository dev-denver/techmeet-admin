"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";

interface MemoData {
  user_id: string;
  memo: string;
  updated_at?: string;
  updated_by_name?: string | null;
}

interface UserMemoDialogProps {
  userId: string;
  userName: string;
  initialMemo: string | null;
}

export function UserMemoDialog({ userId, userName, initialMemo }: UserMemoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [memoData, setMemoData] = useState<MemoData | null>(null);
  const [editText, setEditText] = useState("");
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasMemo = !!(initialMemo && initialMemo.trim());

  const fetchMemo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/memo`);
      const json = await res.json();
      if (json.success) {
        const data: MemoData = json.data;
        setMemoData(data.memo ? data : null);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  function handleOpen() {
    setMode("view");
    setOpen(true);
    fetchMemo();
  }

  function handleStartEdit() {
    setEditText(memoData?.memo ?? "");
    setMode("edit");
  }

  function handleStartCreate() {
    setEditText("");
    setMode("edit");
  }

  function handleCancelEdit() {
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: editText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "저장 실패");
      setMemoData(json.data);
      setMode("view");
      toast.success("메모가 저장되었습니다.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}/memo`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "삭제 실패");
      setMemoData(null);
      setMode("view");
      toast.success("메모가 삭제되었습니다.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleOpen();
        }}
        className="flex w-full max-w-[180px] items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-muted"
        title={hasMemo ? "메모 보기/편집" : "메모 추가"}
        aria-label={`${userName} 메모`}
      >
        <NotebookPen
          className={`h-4 w-4 shrink-0 transition-colors ${
            hasMemo
              ? "fill-amber-100 text-amber-500 dark:fill-amber-900/30"
              : "text-muted-foreground"
          }`}
        />
        {hasMemo ? (
          <span className="truncate text-xs text-amber-700 dark:text-amber-400">
            {initialMemo}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">추가</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-amber-500" />
              관리자 메모 — {userName}
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="-mt-1 text-xs">
            이 메모는 사용자에게 표시되지 않습니다.
          </DialogDescription>

          {loading ? (
            <div className="h-24 animate-pulse rounded-md bg-muted/50" />
          ) : mode === "edit" ? (
            <div className="space-y-2">
              <Textarea
                rows={6}
                placeholder="내부 메모를 입력하세요..."
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="resize-none"
                maxLength={2000}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{editText.length} / 2000</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving || !editText.trim()}>
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </div>
            </div>
          ) : memoData?.memo ? (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                {memoData.memo}
              </div>
              {(memoData.updated_by_name || memoData.updated_at) && (
                <p className="text-xs text-muted-foreground">
                  {memoData.updated_by_name && `${memoData.updated_by_name} · `}
                  {memoData.updated_at && formatDate(memoData.updated_at)}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {deleting ? "삭제 중..." : "삭제"}
                </Button>
                <Button size="sm" onClick={handleStartEdit}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  편집
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <NotebookPen className="h-8 w-8 opacity-30" />
              <p className="text-sm">등록된 메모가 없습니다.</p>
              <Button size="sm" onClick={handleStartCreate}>
                + 메모 작성
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
