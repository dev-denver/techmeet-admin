"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeploymentProjectNoticeCreateDialog } from "./DeploymentProjectNoticeCreateDialog";
import { DeploymentProjectNoticeEditDialog } from "./DeploymentProjectNoticeEditDialog";
import type { DeploymentProjectNotice } from "@/types/deployment";

interface DeploymentProjectNoticesSectionProps {
  projectId: string;
  notices: DeploymentProjectNotice[];
}

export function DeploymentProjectNoticesSection({ projectId, notices }: DeploymentProjectNoticesSectionProps) {
  const [selected, setSelected] = useState<DeploymentProjectNotice | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {notices.length}건</p>
        <DeploymentProjectNoticeCreateDialog projectId={projectId} />
      </div>

      {notices.length === 0 ? (
        <EmptyState title="등록된 이관공지가 없습니다." />
      ) : (
        <>
          {/* 데스크탑/태블릿: 테이블 */}
          <div className="hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-14 text-center lg:table-cell">SEQ</TableHead>
                  <TableHead>주요이관사항</TableHead>
                  <TableHead>날짜</TableHead>
                  <TableHead>주 담당자</TableHead>
                  <TableHead className="hidden lg:table-cell">등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => (
                  <TableRow
                    key={n.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelected(n)}
                  >
                    <TableCell className="hidden text-center font-mono text-xs text-muted-foreground lg:table-cell">#{n.seq_id}</TableCell>
                    <TableCell className="max-w-xs truncate">{n.transfer_notice}</TableCell>
                    <TableCell>{formatDate(n.notice_date)}</TableCell>
                    <TableCell>{n.main_manager}</TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                      {formatDate(n.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="space-y-2 md:hidden">
            {notices.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelected(n)}
                className="w-full rounded-md border p-3 text-left active:bg-muted/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(n.notice_date)}</span>
                  <span className="text-xs text-muted-foreground">#{n.seq_id}</span>
                </div>
                <div className="mt-1 line-clamp-2 text-sm">{n.transfer_notice}</div>
                <div className="mt-1 text-xs text-muted-foreground">담당 {n.main_manager}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <DeploymentProjectNoticeEditDialog
        notice={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
