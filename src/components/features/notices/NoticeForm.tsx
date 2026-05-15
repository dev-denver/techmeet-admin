"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileSpreadsheet, FileText, File, X, Paperclip, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Notice, NoticeAttachment } from "@/types";

const ALLOWED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILE_COUNT = 5;

const noticeSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  is_published: z.boolean(),
  is_important: z.boolean(),
  notice_type: z.enum(["immediate", "scheduled"]),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
});

type NoticeFormSchema = z.infer<typeof noticeSchema>;

interface NoticeFormProps {
  notice?: Notice;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  ) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
  }
  if (mimeType.includes("word")) {
    return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function NoticeForm({ notice }: NoticeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [attachments, setAttachments] = useState<NoticeAttachment[]>(
    notice?.attachments ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!notice;
  const isDeleted = !!notice?.deleted_at;

  const form = useForm<NoticeFormSchema>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice?.title ?? "",
      content: notice?.content ?? "",
      is_published: notice?.is_published ?? false,
      is_important: notice?.is_important ?? false,
      notice_type: notice?.notice_type ?? "immediate",
      start_at: notice?.start_at ?? null,
      end_at: notice?.end_at ?? null,
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    setUploadError(null);

    if (attachments.length + files.length > MAX_FILE_COUNT) {
      setUploadError(`파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setUploadError(`"${file.name}": 허용되지 않는 파일 형식입니다.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`"${file.name}": 파일 크기는 20MB 이하여야 합니다.`);
        return;
      }
    }

    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/notices/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setUploadError(data.error?.message ?? "파일 업로드에 실패했습니다.");
        setUploading(false);
        return;
      }

      const data = await res.json();
      setAttachments((prev) => [...prev, data.data as NoticeAttachment]);
    }
    setUploading(false);
  }

  async function handleRemoveAttachment(attachment: NoticeAttachment) {
    await fetch("/api/notices/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: attachment.path }),
    });
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  async function onSubmit(values: NoticeFormSchema) {
    setError(null);
    const url = isEdit ? `/api/notices/${notice.id}` : "/api/notices";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, attachments }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "저장에 실패했습니다.");
      return;
    }

    router.push("/notices");
    router.refresh();
  }

  async function handleDelete() {
    if (!notice) return;
    setDeleting(true);
    const res = await fetch(`/api/notices/${notice.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/notices");
      router.refresh();
    }
  }

  async function handleRestore() {
    if (!notice) return;
    setRestoring(true);
    const res = await fetch(`/api/notices/${notice.id}/restore`, { method: "PATCH" });
    setRestoring(false);
    if (res.ok) {
      router.push("/notices");
      router.refresh();
    }
  }

  const noticeType = form.watch("notice_type");

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="공지사항 제목" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="공지사항 내용을 입력하세요"
                        rows={18}
                        className="min-h-[280px] resize-y font-mono text-sm leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 게시 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">게시 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>게시 상태</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "true")}
                        defaultValue={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">게시</SelectItem>
                          <SelectItem value="false">미게시</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notice_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>발송 유형</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediate">즉시</SelectItem>
                          <SelectItem value="scheduled">예약</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_important"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm font-medium cursor-pointer">중요 공지</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">상단에 고정 표시됩니다</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 예약 설정 */}
          {noticeType === "scheduled" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">예약 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>게시 시작</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>게시 종료</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 첨부 파일 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">첨부 파일</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                multiple
                onChange={handleFileChange}
                disabled={uploading || isDeleted}
              />

              {attachments.length > 0 && (
                <ul className="space-y-2">
                  {attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <FileIcon mimeType={att.type} />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate hover:underline"
                      >
                        {att.name}
                      </a>
                      <span className="text-muted-foreground shrink-0">
                        {formatFileSize(att.size)}
                      </span>
                      {!isDeleted && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att)}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="파일 삭제"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {!isDeleted && attachments.length < MAX_FILE_COUNT && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4 mr-2" />
                      파일 첨부
                    </>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                xlsx, xls, csv, pdf, doc, docx · 최대 20MB · 최대 {MAX_FILE_COUNT}개
              </p>

              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}
            </CardContent>
          </Card>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3">
            {isEdit && !isDeleted && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                삭제
              </Button>
            )}
            {isEdit && isDeleted && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestoreOpen(true)}
              >
                복구
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting || isDeleted || uploading}>
              {form.formState.isSubmitting ? "저장 중..." : isEdit ? "수정" : "등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="ml-auto"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="공지사항 삭제"
        description="이 공지사항을 삭제하시겠습니까? 삭제된 공지사항은 목록에서 숨겨지며, '삭제된 항목' 필터에서 복구할 수 있습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="공지사항 복구"
        description="이 공지사항을 복구하시겠습니까? 복구 후 목록에 다시 표시됩니다."
        confirmLabel="복구"
        variant="default"
        onConfirm={handleRestore}
        loading={restoring}
      />
    </>
  );
}
