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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const adminSchema = z
  .object({
    name: z.string().min(1, "이름을 입력해주세요"),
    email: z
      .string()
      .min(1, "이메일을 입력해주세요")
      .email("올바른 이메일 형식이 아닙니다"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
    phone: z
      .string()
      .min(1, "휴대폰번호를 입력해주세요")
      .regex(/^01[016789]-\d{4}-\d{4}$/, "올바른 휴대폰번호를 입력해주세요 (예: 010-1234-5678)"),
    role: z.enum(["superadmin", "admin"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

type AdminFormSchema = z.infer<typeof adminSchema>;

export function AdminForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminFormSchema>({
    resolver: zodResolver(adminSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      role: "admin",
    },
  });

  async function onSubmit(values: AdminFormSchema) {
    setError(null);

    const { confirmPassword: _, ...apiData } = values;

    const res = await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiData),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "등록에 실패했습니다.");
      return;
    }

    router.push("/admins");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input placeholder="관리자 이름" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="8자 이상"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (form.getValues("confirmPassword")) {
                      form.trigger("confirmPassword");
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <Input type="password" placeholder="비밀번호 재입력" {...field} />
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
              <FormLabel>휴대폰 번호</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="010-1234-1234"
                  maxLength={13}
                  {...field}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    const formatted =
                      digits.length <= 3
                        ? digits
                        : digits.length <= 7
                          ? `${digits.slice(0, 3)}-${digits.slice(3)}`
                          : `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="superadmin">슈퍼관리자</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "등록 중..." : "등록"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </Form>
  );
}
