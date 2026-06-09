"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface ListFilterProps {
  searchPlaceholder?: string;
  searchScopes?: FilterOption[];
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
}

export function ListFilter({
  searchPlaceholder = "검색...",
  searchScopes,
  filters = [],
}: ListFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const handleSearchSubmit = useCallback(() => {
    updateParams("q", inputValue);
  }, [updateParams, inputValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearchSubmit();
    },
    [handleSearchSubmit]
  );

  return (
    <div className={`flex flex-wrap items-center gap-3 ${isPending ? "opacity-70" : ""}`}>
      <div className="flex gap-2">
        {searchScopes && searchScopes.length > 0 && (
          <Select
            key={`scope-${searchParams.get("scope") ?? "all"}`}
            defaultValue={searchParams.get("scope") ?? "all"}
            onValueChange={(v) => updateParams("scope", v)}
          >
            <SelectTrigger className="w-[110px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {searchScopes.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative w-[350px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8"
          />
        </div>
        <Button onClick={handleSearchSubmit} disabled={isPending} className="shrink-0">
          검색
        </Button>
      </div>
      {filters.map((filter) => (
        <Select
          key={`${filter.key}-${searchParams.get(filter.key) ?? "all"}`}
          defaultValue={searchParams.get(filter.key) ?? "all"}
          onValueChange={(v) => updateParams(filter.key, v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 {filter.label}</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
