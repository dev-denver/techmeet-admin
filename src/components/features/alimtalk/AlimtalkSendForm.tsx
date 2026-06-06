"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import type { AlimtalkTemplate } from "@/types";

const sendSchema = z.object({
  template_id:  z.string().min(1, "템플릿을 선택해주세요."),
  service_type: z.enum(["project", "notice", "individual"]),
  send_type:    z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().nullable(),
  target:       z.enum(["all", "individual"]),
  user_id:      z.string().optional(),
});

type SendFormValues = z.infer<typeof sendSchema>;

export function AlimtalkSendForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [templates, setTemplates] = useState<AlimtalkTemplate[]>([]);

  useEffect(() => {
    fetch("/api/alimtalk/templates?active=true&include_body=true")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTemplates(res.data);
      })
      .catch(() => {});
  }, []);

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      template_id:  "",
      service_type: "notice",
      send_type:    "immediate",
      scheduled_at: null,
      target:       "all",
    },
  });

  const sendType = form.watch("send_type");
  const target = form.watch("target");

  function handleTemplateChange(id: string) {
    form.setValue("template_id", id);
  }

  async function onSubmit(values: SendFormValues) {
    setError(null);
    setSuccess(false);

    const res = await fetch("/api/alimtalk/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      const message = data.error?.message ?? "발송에 실패했습니다.";
      setError(message);
      toast.error(message);
      return;
    }

    setSuccess(true);
    toast.success("알림톡 발송이 완료되었습니다.");
    setTimeout(() => router.push("/alimtalk"), 1500);
  }

  // 선택된 템플릿의 body 찾기
  const templateId = form.watch("template_id");
  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="template_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>템플릿</FormLabel>
              <Select onValueChange={(v) => { field.onChange(v); handleTemplateChange(v); }} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="템플릿을 선택해주세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates.length === 0 && (
                    <SelectItem value="_none" disabled>등록된 템플릿이 없습니다.</SelectItem>
                  )}
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      [{t.code}] {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTemplate && (
          <div className="space-y-1">
            <p className="text-sm font-medium">본문 미리보기</p>
            <Textarea
              value={selectedTemplate.body}
              readOnly
              rows={5}
              className="bg-muted resize-none text-sm text-muted-foreground"
            />
            {selectedTemplate.variables.length > 0 && (
              <p className="text-xs text-muted-foreground">
                치환 변수: {selectedTemplate.variables.map((v) => `#{${v}}`).join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="service_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>서비스 유형</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="project">프로젝트</SelectItem>
                    <SelectItem value="notice">공지</SelectItem>
                    <SelectItem value="individual">개별</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="send_type"
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

        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>발송 대상</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="all">전체 사용자</SelectItem>
                  <SelectItem value="individual">개별 사용자</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {target === "individual" && (
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>사용자 ID</FormLabel>
                <FormControl>
                  <Input placeholder="사용자 UUID" {...field} />
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
  );
}
