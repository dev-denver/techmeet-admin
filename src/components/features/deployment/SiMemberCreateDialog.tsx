"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { siMemberCreateSchema, type SiMemberCreateInput } from "@/lib/api/schemas";

const GRADES = ["초급", "중급", "고급", "특급"] as const;

export function SiMemberCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SiMemberCreateInput>({
    resolver: zodResolver(siMemberCreateSchema),
    defaultValues: { site: "", name: "", project_name: "", detail_work: "", grade: "초급" },
  });

  async function onSubmit(values: SiMemberCreateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/deployment/si-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "등록 실패");
      toast.success("SI 인원이 등록되었습니다.");
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
          <UserPlus className="h-4 w-4 mr-1.5" />
          SI 인원 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>SI 인원 등록</DialogTitle>
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="김영림" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>프로젝트명 <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="다이렉트 차세대" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="detail_work"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상세업무 <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="자동차" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>등급 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="등급 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
