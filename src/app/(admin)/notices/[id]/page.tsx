import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { NoticeForm } from "@/components/features/notices/NoticeForm";
import type { Notice } from "@/types";

async function getNotice(id: string): Promise<Notice | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("notices")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = await getNotice(id);

  if (!notice) notFound();

  return (
    <>
      <Header title="공지사항 수정" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <NoticeForm notice={notice} />
      </main>
    </>
  );
}
