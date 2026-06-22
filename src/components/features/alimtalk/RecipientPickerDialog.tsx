"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AlimtalkRecipient } from "@/types";

const PAGE_SIZE = 20;
const ALL_PROJECTS = "_all";

interface ProjectOption {
  id: string;
  title: string;
}

interface RecipientPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelected: AlimtalkRecipient[];
  onConfirm: (recipients: AlimtalkRecipient[]) => void;
}

export function RecipientPickerDialog({
  open,
  onOpenChange,
  initialSelected,
  onConfirm,
}: RecipientPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [projectId, setProjectId] = useState(ALL_PROJECTS);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [recipients, setRecipients] = useState<AlimtalkRecipient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Map<string, AlimtalkRecipient>>(new Map());

  // 다이얼로그가 열릴 때 부모의 선택 상태로 초기화 (렌더링 중 조정 — effect 미사용)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected(new Map(initialSelected.map((r) => [r.id, r])));
      setSearch("");
      setDebouncedSearch("");
      setProjectId(ALL_PROJECTS);
      setPage(1);
    }
  }

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search, open]);

  useEffect(() => {
    if (!open || projects.length > 0) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProjects(res.data.map((p: { id: string; title: string }) => ({ id: p.id, title: p.title })));
        }
      })
      .catch(() => {});
  }, [open, projects.length]);

  useEffect(() => {
    if (!open) return;
    let active = true;

    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (projectId !== ALL_PROJECTS) params.set("projectId", projectId);

      const res = await fetch(`/api/alimtalk/recipients?${params.toString()}`).then((r) => r.json());
      if (!active) return;
      if (res.success) {
        setRecipients(res.data.recipients);
        setTotal(res.data.total);
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [open, debouncedSearch, projectId, page]);

  function toggleOne(recipient: AlimtalkRecipient, checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (checked) next.set(recipient.id, recipient);
      else next.delete(recipient.id);
      return next;
    });
  }

  function toggleCurrentPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const r of recipients) {
        if (checked) next.set(r.id, r);
        else next.delete(r.id);
      }
      return next;
    });
  }

  const allCurrentPageSelected =
    recipients.length > 0 && recipients.every((r) => selected.has(r.id));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>발송 대상자 선택</DialogTitle>
          <DialogDescription className="sr-only">
            알림톡을 발송할 회원을 검색하고 선택합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="이름, 연락처, 이메일로 검색"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:flex-1"
          />
          <Select
            value={projectId}
            onValueChange={(v) => {
              setProjectId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue placeholder="프로젝트로 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>전체 회원</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">총 {total}명 중 {selected.size}명 선택됨</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleCurrentPage(!allCurrentPageSelected)}
            disabled={recipients.length === 0}
          >
            {allCurrentPageSelected ? "현재 페이지 선택 해제" : "현재 페이지 전체 선택"}
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>이름</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>이메일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    조회 중...
                  </TableCell>
                </TableRow>
              ) : recipients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    조건에 맞는 회원이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={(checked) => toggleOne(r, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.phone ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            이전
          </Button>
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            다음
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirm(Array.from(selected.values()));
              onOpenChange(false);
            }}
          >
            선택 완료 ({selected.size}명)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
