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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X } from "lucide-react";
import { RecipientPickerDialog } from "./RecipientPickerDialog";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AlimtalkRecipient } from "@/types";

const TITLE_MAX = 100;
const CONTENT_MAX = 2000;

const sendSchema = z.object({
  title:        z.string().min(1, "제목을 입력해주세요.").max(TITLE_MAX, `제목은 최대 ${TITLE_MAX}자입니다.`),
  content:      z.string().min(1, "내용을 입력해주세요.").max(CONTENT_MAX, `내용은 최대 ${CONTENT_MAX}자입니다.`),
  send_type:    z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().nullable(),
});

function CharCounter({ length, max }: { length: number; max: number }) {
  const ratio = length / max;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        ratio >= 1 ? "text-destructive" : ratio >= 0.9 ? "text-amber-600" : "text-muted-foreground"
      )}
    >
      {length} / {max}
    </span>
  );
}

type SendFormValues = z.infer<typeof sendSchema>;

export function AlimtalkSendForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipients, setRecipients] = useState<AlimtalkRecipient[]>([]);

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      title:        "",
      content:      "",
      send_type:    "immediate",
      scheduled_at: null,
    },
  });

  const sendType = form.watch("send_type");
  const title = form.watch("title");
  const content = form.watch("content");
  const scheduledAt = form.watch("scheduled_at");

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  async function onSubmit(values: SendFormValues) {
    setError(null);
    setSuccess(false);

    if (recipients.length === 0) {
      setError("발송 대상자를 1명 이상 선택해주세요.");
      return;
    }

    const res = await fetch("/api/alimtalk/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, user_ids: recipients.map((r) => r.id) }),
    });

    if (!res.ok) {
      const data = await res.json();
      const message = data.error?.message ?? "발송에 실패했습니다.";
      setError(message);
      toast.error(message);
      return;
    }

    setSuccess(true);
    toast.success("문자 발송이 완료되었습니다.");
    setTimeout(() => router.push("/alimtalk"), 1500);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:col-span-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-baseline justify-between">
                  <FormLabel>제목</FormLabel>
                  <CharCounter length={field.value.length} max={TITLE_MAX} />
                </div>
                <FormControl>
                  <Input placeholder="발송 제목을 입력해주세요" {...field} />
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
                <div className="flex items-baseline justify-between">
                  <FormLabel>내용</FormLabel>
                  <CharCounter length={field.value.length} max={CONTENT_MAX} />
                </div>
                <FormControl>
                  <Textarea placeholder="발송할 내용을 입력해주세요" rows={14} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>발송 대상자</FormLabel>
            <div>
              <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                대상자 선택
              </Button>
              <span className="ml-3 text-sm text-muted-foreground">총 {recipients.length}명</span>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-md border p-3">
                {recipients.map((r) => (
                  <Badge key={r.id} variant="secondary" className="gap-1 pr-1">
                    {r.name}
                    <button
                      type="button"
                      onClick={() => removeRecipient(r.id)}
                      className="rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <FormField
            control={form.control}
            name="send_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>발송 유형</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-[200px]">
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

          {sendType === "scheduled" && (
            <FormField
              control={form.control}
              name="scheduled_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>예약 발송 일시</FormLabel>
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
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">발송이 완료되었습니다. 잠시 후 목록으로 이동합니다.</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "발송 중..." : "발송"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              취소
            </Button>
          </div>
        </form>
      </Form>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-sm">발송 미리보기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-2 text-xs text-muted-foreground">
                <span>문자메시지</span>
                <span>{sendType === "immediate" ? "지금" : formatDateTime(scheduledAt)}</span>
              </div>
              <div className="mt-3 rounded-xl bg-muted p-4">
                <p className="break-words font-semibold leading-snug">
                  {title || <span className="text-muted-foreground">제목을 입력해주세요</span>}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                  {content || "내용을 입력해주세요"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">발송 대상</span>
                <span className="text-right font-medium">
                  {recipients.length === 0
                    ? "선택된 대상자가 없습니다"
                    : recipients.length <= 3
                      ? recipients.map((r) => r.name).join(", ")
                      : `${recipients.slice(0, 3).map((r) => r.name).join(", ")} 외 ${recipients.length - 3}명`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">발송 시점</span>
                <span className="font-medium">
                  {sendType === "immediate"
                    ? "즉시 발송"
                    : scheduledAt
                      ? formatDateTime(scheduledAt)
                      : "발송 일시를 선택해주세요"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <RecipientPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialSelected={recipients}
        onConfirm={setRecipients}
      />
    </div>
  );
}
