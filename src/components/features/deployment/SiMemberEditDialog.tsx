"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { siMemberCreateSchema, type SiMemberCreateInput } from "@/lib/api/schemas";
import type { SiMember } from "@/types/deployment";

const GRADES = ["초급", "중급", "고급", "특급"] as const;

interface SiMemberEditDialogProps {
  member: SiMember | null;
  onOpenChange: (open: boolean) => void;
}

export function SiMemberEditDialog({ member, onOpenChange }: SiMemberEditDialogProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<SiMemberCreateInput>({
    resolver: zodResolver(siMemberCreateSchema),
    defaultValues: { site: "", name: "", project_name: "", detail_work: "", grade: "초급" },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        site: member.site,
        name: member.name,
        project_name: member.project_name,
        detail_work: member.detail_work,
        grade: member.grade,
      });
      setIsEditing(false);
    }
  }, [member, form]);

  async function onSubmit(values: SiMemberCreateInput) {
    if (!member) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deployment/si-members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "수정 실패");
      toast.success("SI 인원 정보가 수정되었습니다.");
      setIsEditing(false);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!member) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/deployment/si-members/${member.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "삭제 실패");
      toast.success("SI 인원이 삭제되었습니다.");
      setConfirmDelete(false);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    setIsEditing(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={!!member} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              SI 인원 {isEditing ? "수정" : "상세"}
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                          <Input {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={submitting}>
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            member && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">사이트</p>
                    <p className="font-medium">{member.site}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">이름</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">프로젝트명</p>
                    <p className="font-medium">{member.project_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">상세업무</p>
                    <p className="font-medium">{member.detail_work}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">등급</p>
                    <Badge variant="outline">{member.grade}</Badge>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDelete(true)}
                  >
                    삭제
                  </Button>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    수정
                  </Button>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="SI 인원 삭제"
        description={`"${member?.name}" 인원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
