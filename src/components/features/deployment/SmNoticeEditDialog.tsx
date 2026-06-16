"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { smNoticeCreateSchema, type SmNoticeCreateInput } from "@/lib/api/schemas";
import type { SmNotice } from "@/types/deployment";

interface SmNoticeEditDialogProps {
  notice: SmNotice | null;
  onOpenChange: (open: boolean) => void;
}

export function SmNoticeEditDialog({ notice, onOpenChange }: SmNoticeEditDialogProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<SmNoticeCreateInput>({
    resolver: zodResolver(smNoticeCreateSchema),
    defaultValues: { site: "", transfer_notice: "", notice_date: "", main_manager: "" },
  });

  useEffect(() => {
    if (notice) {
      form.reset({
        site: notice.site,
        transfer_notice: notice.transfer_notice,
        notice_date: notice.notice_date,
        main_manager: notice.main_manager,
      });
      setIsEditing(false);
    }
  }, [notice, form]);

  async function onSubmit(values: SmNoticeCreateInput) {
    if (!notice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deployment/sm-notices/${notice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "수정 실패");
      toast.success("이관공지가 수정되었습니다.");
      setIsEditing(false);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!notice) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/deployment/sm-notices/${notice.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "삭제 실패");
      toast.success("이관공지가 삭제되었습니다.");
      setConfirmDelete(false);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    setIsEditing(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={!!notice} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              이관공지 {isEditing ? "수정" : "상세"}
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="site"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사이트 <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="main_manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>주 담당자 <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notice_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>날짜 <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transfer_notice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주요이관사항 <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            notice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">사이트</p>
                    <p className="font-medium">{notice.site}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">주 담당자</p>
                    <p className="font-medium">{notice.main_manager}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">날짜</p>
                    <p className="font-medium">
                      {format(new Date(notice.notice_date), "yyyy.MM.dd")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">주요이관사항</p>
                    <p className="font-medium whitespace-pre-wrap">{notice.transfer_notice}</p>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    삭제
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    수정
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="이관공지 삭제"
        description="이 이관공지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
