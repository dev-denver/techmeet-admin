import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

interface ListPageSkeletonProps {
  title: string;
  columns: number;
  rows?: number;
}

/**
 * 리스트 라우트용 loading.tsx 스켈레톤.
 * 페이지 헤더 + 검색/필터 바 + 데이터 테이블 형태를 미리 그려 체감 로딩을 줄인다.
 */
export function ListPageSkeleton({ title, columns, rows = 8 }: ListPageSkeletonProps) {
  return (
    <>
      <Header title={title} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <DataTableSkeleton columns={columns} rows={rows} />
      </main>
    </>
  );
}
