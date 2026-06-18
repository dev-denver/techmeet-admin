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
import { APPLICATION_STATUS } from "@/lib/constants/status";
import { formatDate, formatRate } from "@/lib/utils/format";

interface ApplicationItem {
  id: string;
  seq_id: number;
  status: string;
  expected_rate: number | null;
  applied_at: string;
  created_at: string;
  project: { id: string; title: string; business_type: string | null } | { id: string; title: string; business_type: string | null }[] | null;
  profile: { id: string; name: string; email: string } | { id: string; name: string; email: string }[] | null;
}

interface ApplicationsTableProps {
  applications: ApplicationItem[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? applications.map((a) => a.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  return (
    <div className="space-y-3">
      <BulkActions
        selectedIds={selected}
        onClearSelection={() => setSelected([])}
        statusOptions={Object.entries(APPLICATION_STATUS).map(([k, v]) => ({
          value: k,
          label: v.label,
        }))}
        bulkStatusEndpoint="/api/applications/bulk"
        exportType="applications"
      />

      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === applications.length && applications.length > 0}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </TableHead>
              <TableHead className="hidden w-16 lg:table-cell">SEQ</TableHead>
              <TableHead className="hidden w-16 lg:table-cell">SM/SI</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>지원자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden xl:table-cell">희망 단가</TableHead>
              <TableHead className="hidden lg:table-cell">지원일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState title="지원서가 없습니다." />
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
                const project = Array.isArray(app.project) ? app.project[0] : app.project;
                const profile = Array.isArray(app.profile) ? app.profile[0] : app.profile;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(app.id)}
                        onCheckedChange={(c) => toggleOne(app.id, !!c)}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">#{app.seq_id}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {project?.business_type ? (
                        <Badge variant="outline" className="uppercase">
                          {project.business_type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-medium hover:underline"
                      >
                        {project?.title ?? "-"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{profile?.name ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                      >
                        {statusConfig?.label ?? app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{formatRate(app.expected_rate)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(app.applied_at ?? app.created_at)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {applications.length === 0 ? (
          <EmptyState title="지원서가 없습니다." />
        ) : (
          applications.map((app) => {
            const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
            const project = Array.isArray(app.project) ? app.project[0] : app.project;
            const profile = Array.isArray(app.profile) ? app.profile[0] : app.profile;
            return (
              <div key={app.id} className="rounded-md border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1 shrink-0"
                    checked={selected.includes(app.id)}
                    onCheckedChange={(c) => toggleOne(app.id, !!c)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-medium hover:underline"
                      >
                        {project?.title ?? "-"}
                      </Link>
                      <Badge
                        variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                        className="shrink-0"
                      >
                        {statusConfig?.label ?? app.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm">{profile?.name ?? "-"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">#{app.seq_id}</span>
                      {project?.business_type && (
                        <span className="uppercase">{project.business_type}</span>
                      )}
                      <span>{formatRate(app.expected_rate)}</span>
                      <span>{formatDate(app.applied_at ?? app.created_at)}</span>
                    </div>
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
