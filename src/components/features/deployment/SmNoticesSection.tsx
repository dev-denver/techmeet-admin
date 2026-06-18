"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SmNoticeCreateDialog } from "./SmNoticeCreateDialog";
import { SmNoticeEditDialog } from "./SmNoticeEditDialog";
import type { SmNotice } from "@/types/deployment";

interface SmNoticesSectionProps {
  notices: SmNotice[];
}

export function SmNoticesSection({ notices }: SmNoticesSectionProps) {
  const [selected, setSelected] = useState<SmNotice | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {notices.length}건</p>
        <SmNoticeCreateDialog />
      </div>

      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-14 text-center lg:table-cell">SEQ</TableHead>
              <TableHead className="hidden w-16 lg:table-cell">SM/SI</TableHead>
              <TableHead>사이트</TableHead>
              <TableHead>주요이관사항</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>주 담당자</TableHead>
              <TableHead className="hidden lg:table-cell">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  등록된 이관공지가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((n) => (
                <TableRow
                  key={n.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(n)}
                >
                  <TableCell className="hidden text-center font-mono text-xs text-muted-foreground lg:table-cell">#{n.seq_id}</TableCell>
                  <TableCell className="hidden lg:table-cell"><Badge variant="outline">SM</Badge></TableCell>
                  <TableCell className="font-medium">{n.site}</TableCell>
                  <TableCell className="max-w-xs truncate">{n.transfer_notice}</TableCell>
                  <TableCell>{format(new Date(n.notice_date), "yyyy.MM.dd")}</TableCell>
                  <TableCell>{n.main_manager}</TableCell>
                  <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                    {format(new Date(n.created_at), "yyyy.MM.dd")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {notices.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            등록된 이관공지가 없습니다.
          </p>
        ) : (
          notices.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelected(n)}
              className="w-full rounded-md border p-3 text-left active:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{n.site}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(n.notice_date), "yyyy.MM.dd")}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.transfer_notice}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                담당 {n.main_manager} · #{n.seq_id}
              </div>
            </button>
          ))
        )}
      </div>

      <SmNoticeEditDialog
        notice={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
