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
import { ACCOUNT_STATUS } from "@/lib/constants/status";
import { formatDateTime } from "@/lib/utils/format";
import type { Profile } from "@/types";

const userSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.string(),
  career_years: z.coerce.number().nullable(),
  portfolio_url: z.string().url("올바른 URL을 입력해주세요").nullable().or(z.literal("")),
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
      skills: user.skills?.join(", ") ?? "",
      career_years: user.career_years ?? null,
      portfolio_url: user.portfolio_url ?? "",
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
      skills: values.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      portfolio_url: values.portfolio_url || null,
    };

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? "저장에 실패했습니다.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* 읽기 전용 정보 */}
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <div className="grid grid-cols-2 gap-4 text-sm">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="career_years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>경력 (년)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : null)
                      }
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
          </div>

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>스킬 (쉼표로 구분)</FormLabel>
                <FormControl>
                  <Input placeholder="React, TypeScript" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portfolio_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>포트폴리오 URL</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://"
                    {...field}
                    value={field.value ?? ""}
                  />
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
