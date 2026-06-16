"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { smNoticeCreateSchema, type SmNoticeCreateInput } from "@/lib/api/schemas";

export function SmNoticeCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SmNoticeCreateInput>({
    resolver: zodResolver(smNoticeCreateSchema),
    defaultValues: { site: "", transfer_notice: "", notice_date: "", main_manager: "" },
  });

  async function onSubmit(values: SmNoticeCreateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/deployment/sm-notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "등록 실패");
      toast.success("이관공지가 등록되었습니다.");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) form.reset();
    setOpen(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          이관공지 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이관공지 등록</DialogTitle>
        </DialogHeader>
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
                      <Input placeholder="KB손보" {...field} />
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
                      <Input placeholder="김영림" {...field} />
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
                    <Textarea
                      placeholder="다이렉트 보험개발원 수정사항 반영"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
