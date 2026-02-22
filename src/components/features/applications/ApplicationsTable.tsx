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
import { formatDate, formatBudget } from "@/lib/utils/format";

interface ApplicationItem {
  id: string;
  status: string;
  expected_budget: number | null;
  created_at: string;
  project: { id: string; title: string } | { id: string; title: string }[] | null;
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === applications.length && applications.length > 0}
                  onCheckedChange={(c) => toggleAll(!!c)}
                />
              </TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>지원자</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>희망 예산</TableHead>
              <TableHead>지원일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
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
                    <TableCell>{formatBudget(app.expected_budget)}</TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
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
