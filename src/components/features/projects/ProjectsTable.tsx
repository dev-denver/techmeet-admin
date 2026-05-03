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
    await fetch(`/api/projects/${id}/restore`, { method: "PATCH" });
    setRestoring(null);
    router.refresh();
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === projects.length && projects.length > 0}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </TableHead>
              <TableHead className="w-28">프로젝트 ID</TableHead>
              <TableHead>제목 / 설명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>노출</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>등록일</TableHead>
              {showDeleted && <TableHead className="w-20">복구</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDeleted ? 9 : 8}>
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
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{project.seq_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-medium hover:underline"
                        >
                          {project.title}
                        </Link>
                        {project.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2 max-w-md whitespace-pre-line">
                            {project.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}>
                        {statusConfig?.label ?? project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.is_visible ? "default" : "secondary"}>
                        {project.is_visible ? "노출" : "숨김"}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.category ?? "-"}</TableCell>
                    <TableCell>{formatDate(project.duration_start_date)}</TableCell>
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
    </div>
  );
}
