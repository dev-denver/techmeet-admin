import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ApplicationDetail } from "@/components/features/applications/ApplicationDetail";

async function getApplication(id: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("applications")
    .select(`
      *,
      project:projects(id, title, status),
      profile:profiles(id, name, email, phone)
    `)
    .eq("id", id)
    .single();
  return data;
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = await getApplication(id);

  if (!application) notFound();

  return (
    <>
      <Header title="지원서 상세" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <ApplicationDetail application={application} />
      </main>
    </>
  );
}
