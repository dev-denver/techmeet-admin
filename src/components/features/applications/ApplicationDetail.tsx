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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUS } from "@/lib/constants/status";
import { formatDate, formatBudget, formatDateTime } from "@/lib/utils/format";
import type { ApplicationStatus } from "@/lib/constants/status";

const statusSchema = z.object({
  status: z.enum(["pending", "reviewed", "accepted", "rejected", "withdrawn"]),
  admin_memo: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ApplicationDetail({ application }: { application: any }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const project = Array.isArray(application.project)
    ? application.project[0]
    : application.project;
  const profile = Array.isArray(application.profile)
    ? application.profile[0]
    : application.profile;

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: application.status as ApplicationStatus,
      admin_memo: application.admin_memo ?? "",
    },
  });

  async function onSubmit(values: StatusFormValues) {
    setError(null);
    const res = await fetch(`/api/applications/${application.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? "저장에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  const statusConfig = APPLICATION_STATUS[application.status as ApplicationStatus];

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">프로젝트</span>
            <p className="font-medium">{project?.title ?? "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">지원자</span>
            <p className="font-medium">{profile?.name ?? "-"}</p>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">현재 상태</span>
            <div className="mt-1">
              <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline"}>
                {statusConfig?.label ?? application.status}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">희망 예산</span>
            <p className="font-medium">{formatBudget(application.expected_budget)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">가능 시작일</span>
            <p className="font-medium">{formatDate(application.available_start_date)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">지원일</span>
            <p className="font-medium">{formatDateTime(application.created_at)}</p>
          </div>
        </div>
      </div>

      {/* 지원서 내용 */}
      {application.cover_letter && (
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold">지원 내용</h2>
          <p className="text-sm whitespace-pre-wrap">{application.cover_letter}</p>
        </div>
      )}

      {/* 상태 변경 */}
      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="font-semibold">상태 변경</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(APPLICATION_STATUS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="admin_memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>관리자 메모</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="내부 메모 (지원자에게 노출되지 않음)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "저장 중..." : "저장"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                목록으로
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
