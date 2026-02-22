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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { Team } from "@/types";

const teamSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력해주세요"),
  description: z.string(),
});

type TeamFormSchema = z.infer<typeof teamSchema>;

interface TeamsManagerProps {
  initialTeams: Team[];
}

export function TeamsManager({ initialTeams }: TeamsManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<TeamFormSchema>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", description: "" },
  });

  async function onSubmit(values: TeamFormSchema) {
    setError(null);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "저장에 실패했습니다.");
      return;
    }

    setOpen(false);
    form.reset();
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/teams/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      setDeleteTarget(null);
      router.refresh();
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">총 {initialTeams.length}개</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                팀 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>팀 추가</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>팀 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="팀 이름" {...field} />
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
                          <Textarea placeholder="팀 설명" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "저장 중..." : "추가"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>팀 이름</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState title="팀이 없습니다." description="새 팀을 추가해보세요." />
                  </TableCell>
                </TableRow>
              ) : (
                initialTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <Link href={`/teams/${team.id}`} className="hover:underline">
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{team.description || "-"}</TableCell>
                    <TableCell>{formatDate(team.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(team)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="팀 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" 팀을 삭제하시겠습니까? 팀에 소속된 멤버 연결도 해제됩니다.`
            : ""
        }
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
