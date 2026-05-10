"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/alimtalk",           label: "발송 이력" },
  { href: "/alimtalk/templates", label: "템플릿 관리" },
  { href: "/alimtalk/send",      label: "알림톡 발송" },
];

export function AlimtalkNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b mb-4">
      {tabs.map((tab) => {
        const isActive = tab.href === "/alimtalk"
          ? pathname === "/alimtalk"
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
