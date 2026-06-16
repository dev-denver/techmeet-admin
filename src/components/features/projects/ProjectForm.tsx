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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PROJECT_STATUS } from "@/lib/constants/status";
import { toast } from "sonner";
import type { Project } from "@/types";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getNextYearString() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

const projectSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
  status: z.enum(["recruiting", "completed", "cancelled"]),
  duration_start_date: z.string().min(1, "시작일을 입력해주세요"),
  duration_end_date: z.string().min(1, "종료일을 입력해주세요"),
  tech_stack: z.string(),
  category: z.string().nullable(),
  business_type: z.enum(["sm", "si"]).nullable(),
  is_visible: z.boolean(),
}).refine(
  (d) => d.duration_end_date >= d.duration_start_date,
  { message: "종료일은 시작일 이후여야 합니다.", path: ["duration_end_date"] }
);

type ProjectFormSchema = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: Project;
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const isEdit = !!project;
  const isDeleted = !!project?.deleted_at;

  const form = useForm<ProjectFormSchema>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "recruiting",
      duration_start_date: project?.duration_start_date ?? getTodayString(),
      duration_end_date: project?.duration_end_date ?? getNextYearString(),
      tech_stack: project?.tech_stack?.join(", ") ?? "",
      category: project?.category ?? null,
      business_type: project?.business_type ?? null,
      is_visible: project?.is_visible ?? true,
    },
  });

  async function onSubmit(values: ProjectFormSchema) {
    setError(null);
    const payload = {
      ...values,
      tech_stack: values.tech_stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
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

    toast.success(isEdit ? "수정되었습니다." : "등록되었습니다.");
    router.push("/projects");
    router.refresh();
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("삭제되었습니다.");
      router.push("/projects");
      router.refresh();
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleRestore() {
    if (!project) return;
    setRestoring(true);
    const res = await fetch(`/api/projects/${project.id}/restore`, { method: "PATCH" });
    setRestoring(false);
    if (res.ok) {
      toast.success("복구되었습니다.");
      router.push("/projects");
      router.refresh();
    } else {
      toast.error("복구에 실패했습니다.");
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="프로젝트 제목" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`프로젝트 상세 설명을 입력해주세요.\n\n예)\n프로젝트 소개:\n- ...\n\n담당 업무:\n- ...\n\n기술 스택:\n- ...`}
                        rows={18}
                        className="resize-y min-h-[280px] font-mono text-sm leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 프로젝트 설정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">프로젝트 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          {Object.entries(PROJECT_STATUS).map(([key, { label }]) => (
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="예: 웹개발"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SM/SI 구분</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="선택 안 함" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">선택 안 함</SelectItem>
                        <SelectItem value="sm">SM</SelectItem>
                        <SelectItem value="si">SI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="duration_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료일</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 기술 스택 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">기술 스택</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="tech_stack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기술 스택 (쉼표로 구분)</FormLabel>
                    <FormControl>
                      <Input placeholder="Java, Spring, JSP, Oracle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 공개 설정 */}
          <Card>
            <CardContent className="pt-4">
              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base">노출 여부</FormLabel>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        활성화 시 사용자 앱에 프로젝트가 노출됩니다.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* 버튼 영역: 삭제(왼쪽) | 저장 | 취소(오른쪽) */}
          <div className="flex items-center gap-3">
            {isEdit && !isDeleted && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                삭제
              </Button>
            )}
            {isEdit && isDeleted && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestoreOpen(true)}
              >
                복구
              </Button>
            )}
            <Button type="submit" disabled={form.formState.isSubmitting || isDeleted}>
              {form.formState.isSubmitting
                ? "저장 중..."
                : isEdit
                ? "수정"
                : "등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="ml-auto"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="프로젝트 삭제"
        description="이 프로젝트를 삭제하시겠습니까? 삭제된 프로젝트는 목록에서 숨겨지며, '삭제된 항목' 필터에서 복구할 수 있습니다."
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
