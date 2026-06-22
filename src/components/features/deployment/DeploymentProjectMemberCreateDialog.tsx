"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deploymentProjectMemberCreateSchema, type DeploymentProjectMemberCreateInput } from "@/lib/api/schemas";

const GRADES = ["초급", "중급", "고급", "특급"] as const;
const NO_GRADE = "__none__";

interface DeploymentProjectMemberCreateDialogProps {
  projectId: string;
}

export function DeploymentProjectMemberCreateDialog({ projectId }: DeploymentProjectMemberCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<DeploymentProjectMemberCreateInput>({
    resolver: zodResolver(deploymentProjectMemberCreateSchema),
    defaultValues: {
      project_id: projectId,
      name: "",
      part: "",
      detail_work: "",
      grade: null,
      memo: "",
    },
  });

  async function onSubmit(values: DeploymentProjectMemberCreateInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/deployment/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "등록 실패");
      toast.success("투입 인원이 등록되었습니다.");
      form.reset({ project_id: projectId, name: "", part: "", detail_work: "", grade: null, memo: "" });
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
          인원 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>투입 인원 추가</DialogTitle>
          <DialogDescription className="sr-only">
            새 투입 인원 정보를 입력합니다.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="part"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>소속파트</FormLabel>
                    <FormControl>
                      <Input placeholder="다이렉트" {...field} value={field.value ?? ""} />
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
                    <FormLabel>상세업무</FormLabel>
                    <FormControl>
                      <Input placeholder="자동차" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>등급</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === NO_GRADE ? null : v)}
                      value={field.value ?? NO_GRADE}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="선택 안 함" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_GRADE}>선택 안 함</SelectItem>
                        {GRADES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
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
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메모</FormLabel>
                  <FormControl>
                    <Textarea placeholder="관리자 메모" rows={3} {...field} value={field.value ?? ""} />
                  </FormControl>
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
