"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserMemoSectionProps {
  userId: string;
}

export function UserMemoSection({ userId }: UserMemoSectionProps) {
  const router = useRouter();
  const [memo, setMemo] = useState("");
  const [savedMemo, setSavedMemo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMemo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/memo`);
      const json = await res.json();
      if (json.success) {
        const value = json.data?.memo ?? "";
        setMemo(value);
        setSavedMemo(value);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMemo();
  }, [fetchMemo]);

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
      setSavedMemo(memo);
      toast.success("메모가 저장되었습니다.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = memo !== savedMemo;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4 space-y-3 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">관리자 메모</h3>
        <span className="ml-auto text-xs text-amber-600/70 dark:text-amber-500/70">
          사용자에게 표시되지 않습니다
        </span>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-md bg-muted/50" />
      ) : (
        <>
          <Textarea
            rows={4}
            placeholder="이 사용자에 대한 내부 메모를 입력하세요..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="resize-none bg-white dark:bg-background"
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{memo.length} / 2000</span>
            <div className="flex gap-2">
              {isDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMemo(savedMemo)}
                >
                  취소
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={saving || !isDirty}
                onClick={handleSave}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
