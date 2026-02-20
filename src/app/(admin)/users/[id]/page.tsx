import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { UserForm } from "@/components/features/users/UserForm";
import type { Profile } from "@/types";

async function getUser(id: string): Promise<Profile | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) notFound();

  return (
    <>
      <Header title="사용자 상세" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <UserForm user={user} />
      </main>
    </>
  );
}
