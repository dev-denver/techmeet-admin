"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkActions } from "@/components/ui/bulk-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECT_STATUS } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { ProjectListItem } from "@/types";

interface ProjectsTableProps {
  projects: ProjectListItem[];
  showDeleted?: boolean;
}

export function ProjectsTable({ projects, showDeleted }: ProjectsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  function toggleAll(checked: boolean) {
    setSelected(checked ? projects.map((p) => p.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  async function handleRestore(id: string) {
    setRestoring(id);
    const res = await fetch(`/api/projects/${id}/restore`, { method: "PATCH" });
    setRestoring(null);
    if (res.ok) {
      toast.success("복구되었습니다.");
      router.refresh();
    } else {
      toast.error("복구에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-3">
      <BulkActions
        selectedIds={selected}
        onClearSelection={() => setSelected([])}
        statusOptions={
          showDeleted
            ? undefined
            : Object.entries(PROJECT_STATUS).map(([k, v]) => ({
                value: k,
                label: v.label,
              }))
        }
        bulkStatusEndpoint={showDeleted ? undefined : "/api/projects/bulk"}
        bulkDeleteEndpoint={showDeleted ? undefined : "/api/projects/bulk"}
        visibilityEndpoint={showDeleted ? undefined : "/api/projects/bulk"}
        bulkRestoreEndpoint={showDeleted ? "/api/projects/bulk/restore" : undefined}
        exportType="projects"
      />

      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === projects.length && projects.length > 0}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </TableHead>
              <TableHead className="hidden w-16 lg:table-cell">SEQ</TableHead>
              <TableHead className="w-16">SM/SI</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden lg:table-cell">노출</TableHead>
              <TableHead className="hidden xl:table-cell">시작일</TableHead>
              <TableHead className="hidden xl:table-cell">종료일</TableHead>
              <TableHead>등록일</TableHead>
              {showDeleted && <TableHead className="w-20">복구</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeleted ? 10 : 9}>
                  <EmptyState title="프로젝트가 없습니다." />
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                const statusConfig = PROJECT_STATUS[project.status];
                return (
                  <TableRow
                    key={project.id}
                    className={project.deleted_at ? "opacity-60" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(project.id)}
                        onCheckedChange={(c) => toggleOne(project.id, !!c)}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{project.seq_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {project.business_type ? (
                        <Badge variant="outline" className="uppercase">
                          {project.business_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                        {statusConfig?.label ?? project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={project.is_visible ? "default" : "secondary"}>
                        {project.is_visible ? "노출" : "숨김"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{formatDate(project.duration_start_date)}</TableCell>
                    <TableCell className="hidden xl:table-cell">{formatDate(project.duration_end_date)}</TableCell>
                    <TableCell>{formatDate(project.created_at)}</TableCell>
                    {showDeleted && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(project.id)}
                          disabled={restoring === project.id}
                        >
                          {restoring === project.id ? "복구 중..." : "복구"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {projects.length === 0 ? (
          <EmptyState title="프로젝트가 없습니다." />
        ) : (
          projects.map((project) => {
            const statusConfig = PROJECT_STATUS[project.status];
            return (
              <div
                key={project.id}
                className={cn(
                  "rounded-md border p-3",
                  project.deleted_at && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1 shrink-0"
                    checked={selected.includes(project.id)}
                    onCheckedChange={(c) => toggleOne(project.id, !!c)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.title}
                      </Link>
                      <Badge
                        variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        className="shrink-0"
                      >
                        {statusConfig?.label ?? project.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">#{project.seq_id}</span>
                      {project.business_type && (
                        <span className="uppercase">{project.business_type}</span>
                      )}
                      <Badge variant={project.is_visible ? "default" : "secondary"} className="text-[10px]">
                        {project.is_visible ? "노출" : "숨김"}
                      </Badge>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                    {showDeleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRestore(project.id)}
                        disabled={restoring === project.id}
                      >
                        {restoring === project.id ? "복구 중..." : "복구"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
