"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  title: string;
  adminName?: string;
}

export function Header({ title, adminName }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* 모바일 햄버거 메뉴 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 페이지 타이틀 */}
      <h1 className="flex-1 text-lg font-semibold">{title}</h1>

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
