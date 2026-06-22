"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// 011~019 포함, 중간 4자리 + 끝 4자리 (11자리 고정)
const PHONE_REGEX = /^01[0-9]-\d{4}-\d{4}$/;

const createSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  name: z.string().min(1, "이름을 입력해주세요.").max(50, "이름은 50자 이내로 입력해주세요."),
  phone: z.string()
    .refine((v) => !v || PHONE_REGEX.test(v), "전화번호 11자리를 모두 입력해주세요. (예: 010-1234-5678)")
    .optional(),
});

type CreateInput = z.infer<typeof createSchema>;

/**
 * 실시간 전화번호 포맷 (3-4-4 고정)
 * prevFormatted 와 비교해 삭제 여부를 판단하여 자동 대시 추가/제거 결정
 */
function formatPhone(rawInput: string, prevFormatted: string): string {
  const digits = rawInput.replace(/\D/g, "").slice(0, 11);
  // 문자 수 기준으로 삭제 여부 판단
  const isDeleting = rawInput.length < prevFormatted.length;

  if (digits.length === 0) return "";

  // 1~3자리: 숫자만, 3자리 완성 시 대시 자동 추가
  if (digits.length <= 3) {
    return !isDeleting && digits.length === 3 ? `${digits}-` : digits;
  }

  // 4~7자리: 010-XXXX, 7자리 완성 시 대시 자동 추가
  if (digits.length <= 7) {
    const partial = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return !isDeleting && digits.length === 7 ? `${partial}-` : partial;
  }

  // 8~11자리: 010-XXXX-XXXX
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function UserCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateInput>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: "", name: "", phone: "" },
  });

  async function onSubmit(values: CreateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          name: values.name,
          phone: values.phone || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "등록 실패");
      toast.success("사용자가 등록되었습니다.");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "사용자 등록에 실패했습니다.");
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
          <UserPlus className="h-4 w-4 mr-1.5" />
          사용자 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            사용자 등록
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="-mt-1 text-xs">
          이메일로 계정을 사전 등록합니다. 사용자가 카카오 로그인 시 동일 이메일로 자동 연결됩니다.
        </DialogDescription>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    이메일 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    이름 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="홍길동" maxLength={50} {...field} />
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
                  <FormLabel>전화번호</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="010-0000-0000"
                      inputMode="numeric"
                      maxLength={13}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(formatPhone(e.target.value, field.value ?? ""));
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
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
