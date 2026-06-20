"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeploymentProjectMemberCreateDialog } from "./DeploymentProjectMemberCreateDialog";
import { DeploymentProjectMemberEditDialog } from "./DeploymentProjectMemberEditDialog";
import type { DeploymentProjectMember } from "@/types/deployment";

interface DeploymentProjectMembersSectionProps {
  projectId: string;
  members: DeploymentProjectMember[];
}

export function DeploymentProjectMembersSection({ projectId, members }: DeploymentProjectMembersSectionProps) {
  const [selected, setSelected] = useState<DeploymentProjectMember | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {members.length}명</p>
        <DeploymentProjectMemberCreateDialog projectId={projectId} />
      </div>

      {members.length === 0 ? (
        <EmptyState title="등록된 투입 인원이 없습니다." />
      ) : (
        <>
          {/* 데스크탑/태블릿: 테이블 */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-14 text-center lg:table-cell">SEQ</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>소속파트</TableHead>
                  <TableHead className="hidden xl:table-cell">상세업무</TableHead>
                  <TableHead>등급</TableHead>
                  <TableHead>메모</TableHead>
                  <TableHead className="hidden lg:table-cell">등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelected(m)}
                  >
                    <TableCell className="hidden text-center font-mono text-xs text-muted-foreground lg:table-cell">#{m.seq_id}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.part || "-"}</TableCell>
                    <TableCell className="hidden xl:table-cell">{m.detail_work || "-"}</TableCell>
                    <TableCell>
                      {m.grade ? <Badge variant="outline">{m.grade}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground" title={m.memo ?? undefined}>
                      {m.memo || "-"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                      {formatDate(m.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-2 md:hidden">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                className="w-full rounded-md border p-3 text-left active:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.grade && <Badge variant="outline">{m.grade}</Badge>}
                </div>
                {m.part && <div className="mt-1 text-sm text-muted-foreground">{m.part}</div>}
                {m.detail_work && (
                  <div className="mt-1 text-xs text-muted-foreground">{m.detail_work}</div>
                )}
                {m.memo && (
                  <div className="mt-1 truncate text-xs text-muted-foreground" title={m.memo}>
                    메모: {m.memo}
                  </div>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  #{m.seq_id} · {formatDate(m.created_at)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <DeploymentProjectMemberEditDialog
        member={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
