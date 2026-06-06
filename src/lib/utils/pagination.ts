export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

interface PageParamsInput {
  page?: string;
  pageSize?: string;
}

interface ResolvedPageParams {
  page: number;
  pageSize: number;
  from: number;
  to: number;
}

/**
 * 리스트 페이지의 page/pageSize 쿼리 파라미터를 안전하게 파싱한다.
 * - page: 1 이상
 * - pageSize: 허용 목록(PAGE_SIZE_OPTIONS) 내 값만 허용, 아니면 defaultSize
 * - from/to: Supabase .range()용 인덱스
 */
export function parsePageParams(
  params: PageParamsInput,
  defaultSize = 20
): ResolvedPageParams {
  const page = Math.max(1, Number(params.page) || 1);
  const requested = Number(params.pageSize);
  const pageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(requested)
    ? requested
    : defaultSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}
