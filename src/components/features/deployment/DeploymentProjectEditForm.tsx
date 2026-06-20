"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DEPLOYMENT_PROJECT_STATUS, DEPLOYMENT_PROJECT_TYPE } from "@/lib/constants/status";
import { toast } from "sonner";
import { deploymentProjectCreateSchema, type DeploymentProjectCreateInput } from "@/lib/api/schemas";
import type { DeploymentProject } from "@/types/deployment";

interface DeploymentProjectEditFormProps {
  project: DeploymentProject;
}

export function DeploymentProjectEditForm({ project }: DeploymentProjectEditFormProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isDeleted = !!project.deleted_at;

  const form = useForm<DeploymentProjectCreateInput>({
    resolver: zodResolver(deploymentProjectCreateSchema),
    defaultValues: { name: project.name, type: project.type, status: project.status },
  });

  async function onSubmit(values: DeploymentProjectCreateInput) {
    const res = await fetch(`/api/deployment/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error?.message ?? "수정에 실패했습니다.");
      return;
    }
    toast.success("프로젝트 정보가 수정되었습니다.");
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/deployment/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("프로젝트가 삭제되었습니다.");
      router.push("/deployment");
      router.refresh();
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleRestore() {
    setRestoring(true);
    const res = await fetch(`/api/deployment/projects/${project.id}/restore`, { method: "PATCH" });
    setRestoring(false);
    if (res.ok) {
      toast.success("복구되었습니다.");
      router.refresh();
    } else {
      toast.error("복구에 실패했습니다.");
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>프로젝트명</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isDeleted} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>구분</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDeleted}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(DEPLOYMENT_PROJECT_TYPE).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isDeleted}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(DEPLOYMENT_PROJECT_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            {!isDeleted && (
              <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                삭제
              </Button>
            )}
            {isDeleted && (
              <Button type="button" variant="outline" onClick={() => setRestoreOpen(true)}>
                복구
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting || isDeleted} className="ml-auto">
              {form.formState.isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="프로젝트 삭제"
        description="이 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 목록에서 숨겨지며, '삭제 여부' 필터에서 복구할 수 있습니다. 소속 인원/이관사항 데이터는 그대로 보존됩니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="프로젝트 복구"
        description="이 프로젝트를 복구하시겠습니까? 복구 후 목록에 다시 표시됩니다."
        confirmLabel="복구"
        variant="default"
        onConfirm={handleRestore}
        loading={restoring}
      />
    </>
  );
}
