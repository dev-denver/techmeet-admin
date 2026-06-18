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
import { SmMemberCreateDialog } from "./SmMemberCreateDialog";
import { SmMemberEditDialog } from "./SmMemberEditDialog";
import type { SmMember } from "@/types/deployment";

interface SmMembersSectionProps {
  members: SmMember[];
}

export function SmMembersSection({ members }: SmMembersSectionProps) {
  const [selected, setSelected] = useState<SmMember | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {members.length}명</p>
        <SmMemberCreateDialog />
      </div>

      {/* 데스크탑/태블릿: 테이블 */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-14 text-center lg:table-cell">SEQ</TableHead>
              <TableHead className="hidden w-16 lg:table-cell">SM/SI</TableHead>
              <TableHead>사이트</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>소속파트</TableHead>
              <TableHead className="hidden xl:table-cell">상세업무</TableHead>
              <TableHead>등급</TableHead>
              <TableHead className="hidden lg:table-cell">등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  등록된 SM 인원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(m)}
                >
                  <TableCell className="hidden text-center font-mono text-xs text-muted-foreground lg:table-cell">#{m.seq_id}</TableCell>
                  <TableCell className="hidden lg:table-cell"><Badge variant="outline">SM</Badge></TableCell>
                  <TableCell className="font-medium">{m.site}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.part}</TableCell>
                  <TableCell className="hidden xl:table-cell">{m.detail_work}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.grade}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground text-xs lg:table-cell">
                    {format(new Date(m.created_at), "yyyy.MM.dd")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 모바일: 카드 리스트 */}
      <div className="space-y-2 md:hidden">
        {members.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            등록된 SM 인원이 없습니다.
          </p>
        ) : (
          members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m)}
              className="w-full rounded-md border p-3 text-left active:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{m.name}</span>
                <Badge variant="outline">{m.grade}</Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{m.site} · {m.part}</div>
              {m.detail_work && (
                <div className="mt-1 text-xs text-muted-foreground">{m.detail_work}</div>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                #{m.seq_id} · {format(new Date(m.created_at), "yyyy.MM.dd")}
              </div>
            </button>
          ))
        )}
      </div>

      <SmMemberEditDialog
        member={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
