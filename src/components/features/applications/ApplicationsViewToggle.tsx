"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const VIEWS = [
  { value: "list", label: "목록형" },
  { value: "grouped", label: "프로젝트별" },
] as const;

export function ApplicationsViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("view") === "grouped" ? "grouped" : "list";

  function setView(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grouped") {
      params.set("view", view);
    } else {
      params.delete("view");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="inline-flex shrink-0 rounded-md border p-1">
      {VIEWS.map((v) => (
        <Button
          key={v.value}
          type="button"
          variant={current === v.value ? "default" : "ghost"}
          size="sm"
          className="h-7"
          onClick={() => setView(v.value)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}
