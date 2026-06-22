"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  Bell,
  MessageSquare,
  ShieldCheck,
  LogOut,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const navItems: { href: string; label: string; icon: React.ElementType }[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "프로젝트", icon: FolderOpen },
  { href: "/applications", label: "지원서", icon: FileText },
  { href: "/users", label: "사용자", icon: Users },
  { href: "/deployment", label: "투입현황", icon: UsersRound },
  { href: "/alimtalk", label: "문자 발송", icon: MessageSquare },
  { href: "/notices", label: "공지사항", icon: Bell },
];

interface SidebarProps {
  onClose?: () => void;
  adminRole?: "superadmin" | "admin";
  /** 데스크탑에서 아이콘만 표시하는 접힘 상태 (모바일 시트에서는 항상 false) */
  collapsed?: boolean;
}

export function Sidebar({ onClose, adminRole, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      {/* 로고 */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-zinc-800",
          collapsed ? "justify-center px-2" : "px-6"
        )}
      >
        <Link
          href="/dashboard"
          className="font-bold tracking-tight"
          onClick={onClose}
          title="TechMeet Admin"
        >
          {collapsed ? <span className="text-lg">TM</span> : <span className="text-lg">TechMeet Admin</span>}
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2" : "px-3",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
        {adminRole === "superadmin" && (
          <Link
            href="/admins"
            onClick={onClose}
            title={collapsed ? "관리자 관리" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "px-3",
              pathname === "/admins" || pathname.startsWith("/admins/")
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && "관리자 관리"}
          </Link>
        )}
      </nav>

      {/* 로그아웃 */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          title={collapsed ? "로그아웃" : undefined}
          className={cn(
            "w-full gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "로그아웃"}
        </Button>
      </div>
    </div>
  );
}
