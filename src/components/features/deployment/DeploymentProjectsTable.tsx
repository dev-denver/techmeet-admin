"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEPLOYMENT_PROJECT_STATUS, DEPLOYMENT_PROJECT_TYPE } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { DeploymentProject } from "@/types/deployment";

interface DeploymentProjectsTableProps {
  projects: DeploymentProject[];
  showDeleted?: boolean;
}

export function DeploymentProjectsTable({ projects, showDeleted }: DeploymentProjectsTableProps) {
  const router = useRouter();
  const [restoring, setRestoring] = useState<string | null>(null);

  async function handleRestore(id: string) {
    setRestoring(id);
    const res = await fetch(`/api/deployment/projects/${id}/restore`, { method: "PATCH" });
    setRestoring(null);
    if (res.ok) {
      toast.success("복구되었습니다.");
      router.refresh();
    } else {
      toast.error("복구에 실패했습니다.");
    }
  }

  if (projects.length === 0) {
    return <EmptyState title="등록된 프로젝트가 없습니다." />;
  }

  return (
    <div className="space-y-3">
      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-16 lg:table-cell">SEQ</TableHead>
              <TableHead className="w-16">구분</TableHead>
              <TableHead>프로젝트명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden lg:table-cell">등록일</TableHead>
              {showDeleted && <TableHead className="w-20">복구</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const statusConfig = DEPLOYMENT_PROJECT_STATUS[project.status];
              const typeConfig = DEPLOYMENT_PROJECT_TYPE[project.type];
              return (
                <TableRow key={project.id} className={project.deleted_at ? "opacity-60" : undefined}>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-xs text-muted-foreground">#{project.seq_id}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeConfig.color}>{typeConfig.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/deployment/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                    {formatDate(project.created_at)}
                  </TableCell>
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
            })}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {projects.map((project) => {
          const statusConfig = DEPLOYMENT_PROJECT_STATUS[project.status];
          const typeConfig = DEPLOYMENT_PROJECT_TYPE[project.type];
          return (
            <div
              key={project.id}
              className={cn("rounded-md border p-3", project.deleted_at && "opacity-60")}
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/deployment/${project.id}`} className="font-medium hover:underline">
                  {project.name}
                </Link>
                <Badge variant={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <Badge variant={typeConfig.color} className="text-[10px]">{typeConfig.label}</Badge>
                <span className="font-mono">#{project.seq_id}</span>
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
          );
        })}
      </div>
    </div>
  );
}
