import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { AlimtalkTemplateForm } from "@/components/features/alimtalk/AlimtalkTemplateForm";
import type { AlimtalkTemplate } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlimtalkTemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("alimtalk_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  return (
    <>
      <Header title="템플릿 수정" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <AlimtalkTemplateForm template={data as AlimtalkTemplate} />
      </main>
    </>
  );
}
