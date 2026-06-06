import { ListPageSkeleton } from "@/components/ui/list-page-skeleton";

export default function Loading() {
  return <ListPageSkeleton title="공지사항" columns={5} />;
}
