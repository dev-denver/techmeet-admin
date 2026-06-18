import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListFilter } from "@/components/ui/list-filter";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { AlimtalkNav } from "@/components/features/alimtalk/AlimtalkNav";
import { ALIMTALK_SERVICE_TYPE } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import type { AlimtalkTemplateListItem } from "@/types";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ q?: string; service_type?: string; active?: string; page?: string }>;
}

async function getTemplates(params: { q?: string; service_type?: string; active?: string; page?: string }) {
  const adminClient = createAdminClient();
  const page = Number(params.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = adminClient
    .from("alimtalk_templates")
    .select("id, seq_id, code, name, service_type, is_active, variables, created_at", { count: "exact" });

  if (params.q) query = query.or(`code.ilike.%${params.q}%,name.ilike.%${params.q}%`);
  if (params.service_type) query = query.eq("service_type", params.service_type);
  if (params.active === "true") query = query.eq("is_active", true);
  else if (params.active === "false") query = query.eq("is_active", false);

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  return { templates: (data ?? []) as AlimtalkTemplateListItem[], total: count ?? 0 };
}

export default async function AlimtalkTemplatesPage({ searchParams }: Props) {
  const params = await searchParams;
  const { templates, total } = await getTemplates(params);

  return (
    <>
      <Header title="알림톡" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AlimtalkNav />

        <div className="flex items-center justify-between mb-4">
          <Suspense>
            <ListFilter
              searchPlaceholder="코드·이름 검색..."
              filters={[
                {
                  key: "service_type",
                  label: "유형",
                  options: Object.entries(ALIMTALK_SERVICE_TYPE).map(([value, { label }]) => ({
                    value,
                    label,
                  })),
                },
                {
                  key: "active",
                  label: "활성화",
                  options: [
                    { value: "true", label: "활성" },
                    { value: "false", label: "비활성" },
                  ],
                },
              ]}
            />
          </Suspense>
          <Button asChild size="sm" className="ml-3 shrink-0">
            <Link href="/alimtalk/templates/new">
              <Plus className="h-4 w-4 mr-2" />
              템플릿 등록
            </Link>
          </Button>
        </div>

        {/* 데스크탑/태블릿: 테이블 */}
        <div className="hidden rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-16 lg:table-cell">ID</TableHead>
                <TableHead>코드</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>유형</TableHead>
                <TableHead className="hidden xl:table-cell">변수</TableHead>
                <TableHead>활성화</TableHead>
                <TableHead className="hidden lg:table-cell">등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState title="등록된 템플릿이 없습니다." />
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">#{t.seq_id}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/alimtalk/templates/${t.id}`} className="font-mono text-sm hover:underline">
                        {t.code}
                      </Link>
                    </TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>
                      <Badge variant={ALIMTALK_SERVICE_TYPE[t.service_type]?.color as "default" | "secondary" | "outline" ?? "outline"}>
                        {ALIMTALK_SERVICE_TYPE[t.service_type]?.label ?? t.service_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {t.variables.length > 0 ? (
                        <span className="text-xs text-muted-foreground">{t.variables.join(", ")}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(t.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <div className="space-y-2 md:hidden">
          {templates.length === 0 ? (
            <EmptyState title="등록된 템플릿이 없습니다." />
          ) : (
            templates.map((t) => (
              <Link
                key={t.id}
                href={`/alimtalk/templates/${t.id}`}
                className="block rounded-md border p-3 active:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{t.code}</p>
                  </div>
                  <Badge variant={t.is_active ? "default" : "secondary"}>
                    {t.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <Badge variant={ALIMTALK_SERVICE_TYPE[t.service_type]?.color as "default" | "secondary" | "outline" ?? "outline"} className="text-[10px]">
                    {ALIMTALK_SERVICE_TYPE[t.service_type]?.label ?? t.service_type}
                  </Badge>
                  <span>{formatDate(t.created_at)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <Suspense>
          <PaginationControls total={total} pageSize={PAGE_SIZE} />
        </Suspense>
      </main>
    </>
  );
}
