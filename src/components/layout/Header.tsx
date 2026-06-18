"use client";

import { useState } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";
import { Sidebar } from "./Sidebar";
import { useSidebar } from "./sidebar-context";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title: string;
  adminName?: string;
}

export function Header({ title, adminName }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background px-4 sm:gap-4 sm:px-6">
      {/* 모바일 햄버거 메뉴 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden.Root>
            <SheetTitle>메뉴</SheetTitle>
            <SheetDescription>관리자 페이지 이동 메뉴</SheetDescription>
          </VisuallyHidden.Root>
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 데스크탑 사이드바 접기 토글 */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={toggle}
        title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        <span className="sr-only">사이드바 토글</span>
      </Button>

      {/* 페이지 타이틀 */}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>

      {/* 테마 토글 + 관리자 이름 */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {adminName && (
          <span className="text-sm text-muted-foreground">{adminName}</span>
        )}
      </div>
    </header>
  );
}
