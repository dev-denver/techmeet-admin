"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserMemoDialogProps {
  userId: string;
  userName: string;
  initialMemo: string | null;
}

export function UserMemoDialog({ userId, userName, initialMemo }: UserMemoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [memo, setMemo] = useState(initialMemo ?? "");
  const [saving, setSaving] = useState(false);
  const hasMemo = !!(initialMemo && initialMemo.trim());

  function handleOpen() {
    setMemo(initialMemo ?? "");
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/memo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "저장 실패");
      toast.success("메모가 저장되었습니다.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded p-1 transition-colors hover:bg-muted"
        title={hasMemo ? "메모 보기/편집" : "메모 추가"}
        aria-label={`${userName} 메모 편집`}
      >
        <NotebookPen
          className={`h-4 w-4 transition-colors ${
            hasMemo
              ? "fill-amber-100 text-amber-500 dark:fill-amber-900/30"
              : "text-muted-foreground"
          }`}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-amber-500" />
              관리자 메모 — {userName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <DialogDescription className="text-xs">
              이 메모는 사용자에게 표시되지 않습니다.
            </DialogDescription>
            <Textarea
              rows={5}
              placeholder="내부 메모를 입력하세요..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="resize-none"
              maxLength={2000}
              autoFocus
            />
            <p className="text-right text-xs text-muted-foreground">{memo.length} / 2000</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
