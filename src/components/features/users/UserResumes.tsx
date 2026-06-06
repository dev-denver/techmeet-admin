"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils/format";
import type { ProfileResume } from "@/types/user";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UserResumesProps {
  userId: string;
}

export function UserResumes({ userId }: UserResumesProps) {
  const [resumes, setResumes] = useState<ProfileResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ProfileResume | null>(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}/resumes`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "불러오기 실패");
      setResumes(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  async function handleDownload(resume: ProfileResume) {
    setDownloadingId(resume.id);
    try {
      const res = await fetch(`/api/users/${userId}/resumes/${resume.id}/signed`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "URL 생성 실패");

      const fileRes = await fetch(json.data.url);
      if (!fileRes.ok) throw new Error("파일 다운로드에 실패했습니다.");
      const blob = await fileRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = resume.file_name;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "다운로드에 실패했습니다.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setDeletingId(confirmTarget.id);
    try {
      const res = await fetch(`/api/users/${userId}/resumes/${confirmTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "삭제 실패");
      setResumes((prev) => prev.filter((r) => r.id !== confirmTarget.id));
      toast.success("이력서를 삭제했습니다.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
      setConfirmTarget(null);
    }
  }

  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchResumes}>
          다시 시도
        </Button>
      </div>
    );
  }

  if (resumes.length === 0) {
    return <EmptyState title="업로드된 이력서가 없습니다." />;
  }

  return (
    <>
      <div className="space-y-2">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex items-center gap-3 rounded-lg border p-4"
          >
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{resume.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(resume.file_size)} · {formatDateTime(resume.created_at)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={downloadingId === resume.id}
                onClick={() => handleDownload(resume)}
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                {downloadingId === resume.id ? "다운로드 중..." : "다운로드"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={deletingId === resume.id}
                onClick={() => setConfirmTarget(resume)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null); }}
        title="이력서 삭제"
        description={`"${confirmTarget?.file_name}" 파일을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        loading={!!deletingId}
        onConfirm={handleDelete}
      />
    </>
  );
}
