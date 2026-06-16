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
import { SiMemberCreateDialog } from "./SiMemberCreateDialog";
import { SiMemberEditDialog } from "./SiMemberEditDialog";
import type { SiMember } from "@/types/deployment";

interface SiMembersSectionProps {
  members: SiMember[];
}

export function SiMembersSection({ members }: SiMembersSectionProps) {
  const [selected, setSelected] = useState<SiMember | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {members.length}명</p>
        <SiMemberCreateDialog />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">No</TableHead>
              <TableHead>사이트</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>프로젝트명</TableHead>
              <TableHead>상세업무</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  등록된 SI 인원이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m, i) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelected(m)}
                >
                  <TableCell className="text-center text-muted-foreground text-xs">{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.site}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.project_name}</TableCell>
                  <TableCell>{m.detail_work}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.grade}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {format(new Date(m.created_at), "yyyy.MM.dd")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SiMemberEditDialog
        member={selected}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
