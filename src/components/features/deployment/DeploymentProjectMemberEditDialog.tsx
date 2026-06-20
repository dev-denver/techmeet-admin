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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { deploymentProjectMemberCreateSchema, type DeploymentProjectMemberCreateInput } from "@/lib/api/schemas";
import type { DeploymentProjectMember } from "@/types/deployment";

const GRADES = ["초급", "중급", "고급", "특급"] as const;
const NO_GRADE = "__none__";

interface DeploymentProjectMemberEditDialogProps {
  member: DeploymentProjectMember | null;
  onOpenChange: (open: boolean) => void;
}

export function DeploymentProjectMemberEditDialog({ member, onOpenChange }: DeploymentProjectMemberEditDialogProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<DeploymentProjectMemberCreateInput>({
    resolver: zodResolver(deploymentProjectMemberCreateSchema),
    defaultValues: { project_id: "", name: "", part: "", detail_work: "", grade: null, memo: "" },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        project_id: member.project_id,
        name: member.name,
        part: member.part ?? "",
        detail_work: member.detail_work ?? "",
        grade: member.grade,
        memo: member.memo ?? "",
      });
      setIsEditing(false);
    }
  }, [member, form]);

  async function onSubmit(values: DeploymentProjectMemberCreateInput) {
    if (!member) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deployment/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "수정 실패");
      toast.success("투입 인원 정보가 수정되었습니다.");
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
      const res = await fetch(`/api/deployment/members/${member.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "삭제 실패");
      toast.success("투입 인원이 삭제되었습니다.");
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
              투입 인원 {isEditing ? "수정" : "상세"}
            </DialogTitle>
          </DialogHeader>

          {isEditing ? (
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
                          <Input {...field} />
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
                          <Input {...field} value={field.value ?? ""} />
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
                          <Input {...field} value={field.value ?? ""} />
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
                              <SelectValue />
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
                        <Textarea rows={3} {...field} value={field.value ?? ""} />
                      </FormControl>
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
                    <p className="text-muted-foreground text-xs mb-0.5">이름</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">소속파트</p>
                    <p className="font-medium">{member.part || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">상세업무</p>
                    <p className="font-medium">{member.detail_work || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">등급</p>
                    {member.grade ? <Badge variant="outline">{member.grade}</Badge> : <p className="font-medium">-</p>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">메모</p>
                    <p className="font-medium whitespace-pre-wrap">{member.memo || "-"}</p>
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
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
        title="투입 인원 삭제"
        description={`"${member?.name}" 인원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
