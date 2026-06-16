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

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center">SEQ</TableHead>
              <TableHead className="w-16">SM/SI</TableHead>
              <TableHead>사이트</TableHead>
              <TableHead>주요이관사항</TableHead>
              <TableHead>날짜</TableHead>
              <TableHead>주 담당자</TableHead>
              <TableHead>등록일</TableHead>
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
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">#{n.seq_id}</TableCell>
                  <TableCell><Badge variant="outline">SM</Badge></TableCell>
                  <TableCell className="font-medium">{n.site}</TableCell>
                  <TableCell className="max-w-xs truncate">{n.transfer_notice}</TableCell>
                  <TableCell>{format(new Date(n.notice_date), "yyyy.MM.dd")}</TableCell>
                  <TableCell>{n.main_manager}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(n.created_at), "yyyy.MM.dd")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SmNoticeEditDialog
        notice={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
