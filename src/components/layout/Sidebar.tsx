"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  UsersRound,
  FileText,
  Bell,
  MessageSquare,
  ShieldCheck,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/projects", label: "프로젝트", icon: FolderOpen },
  { href: "/users", label: "사용자", icon: Users },
  { href: "/teams", label: "팀", icon: UsersRound },
  { href: "/applications", label: "지원서", icon: FileText },
  { href: "/notices", label: "공지사항", icon: Bell },
  { href: "/alimtalk", label: "알림톡", icon: MessageSquare },
  { href: "/audit-logs", label: "활동 로그", icon: ClipboardList },
];

interface SidebarProps {
  onClose?: () => void;
  adminRole?: "superadmin" | "admin";
}

export function Sidebar({ onClose, adminRole }: SidebarProps) {
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
      <div className="flex h-16 items-center px-6 border-b border-zinc-800">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight"
          onClick={onClose}
        >
          TechMeet Admin
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {adminRole === "superadmin" && (
          <Link
            href="/admins"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/admins" || pathname.startsWith("/admins/")
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            관리자 관리
          </Link>
        )}
      </nav>

      {/* 로그아웃 */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
