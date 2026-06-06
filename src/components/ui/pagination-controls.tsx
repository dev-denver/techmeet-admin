"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationControlsProps {
  total: number;
  pageSize: number;
  /** 전달 시 페이지 크기 선택 UI 노출 (페이지가 pageSize 파라미터를 읽는 경우에만 사용) */
  pageSizeOptions?: readonly number[];
}

export function PaginationControls({
  total,
  pageSize,
  pageSizeOptions,
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [jump, setJump] = useState("");

  function goToPage(p: number) {
    const clamped = Math.min(totalPages, Math.max(1, p));
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(clamped));
    router.push(`${pathname}?${params.toString()}`);
  }

  function changePageSize(size: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", size);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitJump(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(jump);
    if (Number.isFinite(n) && n >= 1) goToPage(n);
    setJump("");
  }

  const showNav = totalPages > 1;
  if (!showNav && !pageSizeOptions) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          총 {total}건 중{" "}
          {total === 0 ? 0 : (page - 1) * pageSize + 1}-
          {Math.min(page * pageSize, total)}
        </p>
        {pageSizeOptions && (
          <Select value={String(pageSize)} onValueChange={changePageSize}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}개씩
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {showNav && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => goToPage(1)}
            aria-label="첫 페이지"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* 데스크탑: 페이지 번호 */}
          <div className="hidden items-center gap-1 sm:flex">
            {pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
          </div>

          {/* 모바일: 현재/전체 표시 */}
          <span className="px-2 text-sm text-muted-foreground sm:hidden">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => goToPage(totalPages)}
            aria-label="마지막 페이지"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* 페이지 직접 입력 (데스크탑) */}
          <form onSubmit={submitJump} className="ml-2 hidden items-center gap-1 sm:flex">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              placeholder="이동"
              aria-label="페이지 번호로 이동"
              className="h-8 w-16"
            />
          </form>
        </div>
      )}
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
