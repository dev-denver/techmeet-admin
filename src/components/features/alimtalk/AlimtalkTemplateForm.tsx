"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { AlimtalkTemplate } from "@/types";

const templateSchema = z.object({
  code:         z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/, "대문자·숫자·언더스코어만 사용 가능합니다."),
  name:         z.string().min(1, "템플릿 이름을 입력해주세요.").max(200),
  body:         z.string().min(1, "본문을 입력해주세요."),
  variables:    z.string(),
  service_type: z.enum(["project", "notice", "individual", "all"]),
  is_active:    z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface Props {
  template?: AlimtalkTemplate;
}

export function AlimtalkTemplateForm({ template }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEdit = !!template;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      code:         template?.code ?? "",
      name:         template?.name ?? "",
      body:         template?.body ?? "",
      variables:    template?.variables?.join(", ") ?? "",
      service_type: template?.service_type ?? "notice",
      is_active:    template?.is_active ?? true,
    },
  });

  async function onSubmit(values: TemplateFormValues) {
    setError(null);
    const url = isEdit ? `/api/alimtalk/templates/${template.id}` : "/api/alimtalk/templates";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...values,
      variables: values.variables
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "저장에 실패했습니다.");
      return;
    }

    router.push("/alimtalk/templates");
    router.refresh();
  }

  async function handleDelete() {
    if (!template) return;
    setDeleting(true);
    const res = await fetch(`/api/alimtalk/templates/${template.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "삭제에 실패했습니다.");
      setDeleteOpen(false);
      return;
    }

    router.push("/alimtalk/templates");
    router.refresh();
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>템플릿 코드</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="PROJECT_RECRUIT_001"
                      {...field}
                      disabled={isEdit}
                      className={isEdit ? "bg-muted" : ""}
                    />
                  </FormControl>
                  <FormDescription>대문자, 숫자, 언더스코어만 사용 가능합니다.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>템플릿 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="프로젝트 모집 알림" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="all">전체</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variables"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>치환 변수</FormLabel>
                  <FormControl>
                    <Input placeholder="name, project_title" {...field} />
                  </FormControl>
                  <FormDescription>쉼표로 구분. 본문에서 #{"{변수명}"} 형식으로 사용.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>본문</FormLabel>
                <FormControl>
                  <Textarea placeholder="안녕하세요 #{name}님, ..." rows={8} {...field} />
                </FormControl>
                <FormDescription>#{"{변수명}"} 형식으로 치환 변수를 사용할 수 있습니다.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer">활성화</FormLabel>
              </FormItem>
            )}
          />

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
                onClick={() => setDeleteOpen(true)}
              >
                삭제
              </Button>
            )}
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="템플릿 삭제"
        description="이 템플릿을 정말 삭제하시겠습니까? 발송 이력이 있는 경우 삭제가 거부됩니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
