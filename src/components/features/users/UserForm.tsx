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
import { toast } from "sonner";
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { Profile } from "@/types";

const userSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  tech_stack: z.string(),
  account_status: z.enum(["active", "withdrawn"]),
  notification_new_project: z.boolean(),
  notification_application_update: z.boolean(),
  notification_marketing: z.boolean(),
});

type UserFormSchema = z.infer<typeof userSchema>;

interface UserFormProps {
  user: Profile;
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UserFormSchema>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? null,
      bio: user.bio ?? null,
      tech_stack: user.tech_stack?.join(", ") ?? "",
      account_status: user.account_status,
      notification_new_project: user.notification_new_project,
      notification_application_update: user.notification_application_update,
      notification_marketing: user.notification_marketing,
    },
  });

  async function onSubmit(values: UserFormSchema) {
    setError(null);
    const payload = {
      ...values,
      tech_stack: values.tech_stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      const message = data.error?.message ?? "저장에 실패했습니다.";
      setError(message);
      toast.error(message);
      return;
    }

    toast.success("변경사항이 저장되었습니다.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* 읽기 전용 정보 */}
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">이메일</span>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <span className="text-muted-foreground">가입일</span>
            <p className="font-medium">{formatDateTime(user.created_at)}</p>
          </div>
          {user.withdrawn_at && (
            <div>
              <span className="text-muted-foreground">탈퇴일</span>
              <p className="font-medium">{formatDateTime(user.withdrawn_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* 회원가입 시 입력한 프로필 정보 */}
      <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
        <p className="text-sm font-medium text-muted-foreground">프로필 정보</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-muted-foreground">생년월일</span>
            <p className="font-medium">{user.birth_date ? formatDate(user.birth_date) : "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">성별</span>
            <p className="font-medium">
              {user.gender === "male" ? "남성" : user.gender === "female" ? "여성" : "-"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">투입 가능 상태</span>
            <p className="font-medium">
              {user.availability_status === "available"
                ? "가능"
                : user.availability_status === "partial"
                ? "일부 가능"
                : user.availability_status === "unavailable"
                ? "불가"
                : "-"}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">투입 가능 시작일</span>
            <p className="font-medium">{user.available_from_date ? formatDate(user.available_from_date) : "-"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">주소</span>
            <p className="font-medium">{user.address ?? "-"}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>연락처</FormLabel>
                  <FormControl>
                    <Input
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

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>소개</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
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
            name="account_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>계정 상태</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ACCOUNT_STATUS).map(([key, { label }]) => (
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
            name="tech_stack"
            render={({ field }) => (
              <FormItem>
                <FormLabel>기술 스택 (쉼표로 구분)</FormLabel>
                <FormControl>
                  <Input placeholder="React, TypeScript" {...field} />
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
              취소
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
