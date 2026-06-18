"use client";

import { cn } from "@/lib/utils/cn";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";

interface AdminShellProps {
  adminRole?: "superadmin" | "admin";
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

function ShellInner({ adminRole, children }: { adminRole?: "superadmin" | "admin"; children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크탑 사이드바 (접기 가능) */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 transition-[width] duration-200 ease-in-out",
          collapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <Sidebar adminRole={adminRole} collapsed={collapsed} />
      </aside>

      {/* 메인 콘텐츠 영역 - 사이드바 너비만큼 패딩 */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-screen transition-[padding] duration-200 ease-in-out",
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AdminShell({ adminRole, defaultCollapsed, children }: AdminShellProps) {
  return (
    <SidebarProvider defaultCollapsed={defaultCollapsed}>
      <ShellInner adminRole={adminRole}>{children}</ShellInner>
    </SidebarProvider>
  );
}
