"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkActions } from "@/components/ui/bulk-actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APPLICATION_STATUS, PROJECT_STATUS } from "@/lib/constants/status";
import { formatDate, formatRate } from "@/lib/utils/format";

interface ApplicationItem {
  id: string;
  seq_id: number;
  status: string;
  expected_rate: number | null;
  applied_at: string;
  created_at: string;
  profile: { id: string; name: string; email: string } | { id: string; name: string; email: string }[] | null;
}

interface ProjectGroup {
  project: { id: string; title: string; status: string } | { id: string; title: string; status: string }[] | null;
  applications: ApplicationItem[];
}

interface ApplicationsGroupedViewProps {
  groups: ProjectGroup[];
}

export function ApplicationsGroupedView({ groups }: ApplicationsGroupedViewProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const allIds = groups.flatMap((g) => g.applications.map((a) => a.id));
  const allSelected = allIds.length > 0 && selected.length === allIds.length;

  function toggleAll(checked: boolean) {
    setSelected(checked ? allIds : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function toggleGroup(ids: string[], checked: boolean) {
    setSelected((prev) =>
      checked
        ? [...new Set([...prev, ...ids])]
        : prev.filter((x) => !ids.includes(x))
    );
  }

  if (groups.length === 0) {
    return (
      <div className="space-y-3">
        <BulkActions
          selectedIds={selected}
          onClearSelection={() => setSelected([])}
          exportType="applications"
        />
        <div className="rounded-md border">
          <EmptyState title="지원서가 없습니다." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(!!c)} />
          전체 선택
        </label>
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
      </div>

      <div className="rounded-md border">
        <Accordion type="multiple" className="px-4">
          {groups.map(({ project, applications }) => {
            const proj = Array.isArray(project) ? project[0] : project;
            const projectStatus = proj
              ? PROJECT_STATUS[proj.status as keyof typeof PROJECT_STATUS]
              : null;
            const groupIds = applications.map((a) => a.id);
            const groupSelected = groupIds.length > 0 && groupIds.every((id) => selected.includes(id));

            return (
              <AccordionItem key={proj?.id ?? "unassigned"} value={proj?.id ?? "unassigned"}>
                <AccordionTrigger>
                  <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{proj?.title ?? "알 수 없는 프로젝트"}</span>
                      {projectStatus && (
                        <Badge variant={projectStatus.color as "default" | "secondary" | "destructive" | "outline"}>
                          {projectStatus.label}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">지원 {applications.length}건</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {proj && (
                    <Link
                      href={`/projects/${proj.id}`}
                      className="mb-2 inline-block text-sm text-muted-foreground hover:underline"
                    >
                      프로젝트 상세보기 →
                    </Link>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={groupSelected}
                            onCheckedChange={(c) => toggleGroup(groupIds, !!c)}
                          />
                        </TableHead>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>지원자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>희망 단가</TableHead>
                        <TableHead>지원일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((app) => {
                        const statusConfig = APPLICATION_STATUS[app.status as keyof typeof APPLICATION_STATUS];
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
                              <span className="font-mono text-xs text-muted-foreground">#{app.seq_id}</span>
                            </TableCell>
                            <TableCell>
                              <Link href={`/applications/${app.id}`} className="font-medium hover:underline">
                                {profile?.name ?? "-"}
                              </Link>
                              <p className="text-xs text-muted-foreground">{profile?.email}</p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline" ?? "secondary"}
                              >
                                {statusConfig?.label ?? app.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatRate(app.expected_rate)}</TableCell>
                            <TableCell>{formatDate(app.applied_at ?? app.created_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
