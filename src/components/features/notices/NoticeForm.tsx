"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Notice } from "@/types";

const noticeSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  is_published: z.boolean(),
  notice_type: z.enum(["immediate", "scheduled"]),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
});

type NoticeFormSchema = z.infer<typeof noticeSchema>;

interface NoticeFormProps {
  notice?: Notice;
}

export function NoticeForm({ notice }: NoticeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!notice;

  const form = useForm<NoticeFormSchema>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: notice?.title ?? "",
      content: notice?.content ?? "",
      is_published: notice?.is_published ?? false,
      notice_type: notice?.notice_type ?? "immediate",
      start_at: notice?.start_at ?? null,
      end_at: notice?.end_at ?? null,
    },
  });

  async function onSubmit(values: NoticeFormSchema) {
    setError(null);
    const url = isEdit ? `/api/notices/${notice.id}` : "/api/notices";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? "저장에 실패했습니다.");
      return;
    }

    router.push("/notices");
    router.refresh();
  }

  async function handleDelete() {
    if (!notice || !confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/notices/${notice.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/notices");
      router.refresh();
    }
  }

  const noticeType = form.watch("notice_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Textarea placeholder="공지사항 내용" rows={8} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        {noticeType === "scheduled" && (
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
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "저장 중..." : isEdit ? "수정" : "등록"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          {isEdit && (
            <Button
              type="button"
              variant="destructive"
              className="ml-auto"
              onClick={handleDelete}
            >
              삭제
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
