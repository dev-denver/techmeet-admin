"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDate, formatBudget } from "@/lib/utils/format";
import type { ProjectListItem } from "@/types";

interface ProjectsTableProps {
  projects: ProjectListItem[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? projects.map((p) => p.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  return (
    <div className="space-y-3">
      <BulkActions
        selectedIds={selected}
        onClearSelection={() => setSelected([])}
        statusOptions={Object.entries(PROJECT_STATUS).map(([k, v]) => ({
          value: k,
          label: v.label,
        }))}
        bulkStatusEndpoint="/api/projects/bulk"
        bulkDeleteEndpoint="/api/projects/bulk"
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
              <TableHead>제목</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>예산</TableHead>
              <TableHead>시작일</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState title="프로젝트가 없습니다." />
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                const statusConfig = PROJECT_STATUS[project.status];
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(project.id)}
                        onCheckedChange={(c) => toggleOne(project.id, !!c)}
                      />
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
                    <TableCell>{project.category ?? "-"}</TableCell>
                    <TableCell>
                      {project.budget_min != null
                        ? `${formatBudget(project.budget_min)} ~ ${project.budget_max != null ? formatBudget(project.budget_max) : ""}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
                    <TableCell>{formatDate(project.created_at)}</TableCell>
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
