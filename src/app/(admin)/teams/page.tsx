import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { TeamsManager } from "@/components/features/teams/TeamsManager";
import type { Team } from "@/types";

async function getTeams(): Promise<Team[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("teams")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <>
      <Header title="팀" />
      <main className="flex-1 overflow-y-auto p-6">
        <TeamsManager initialTeams={teams} />
      </main>
    </>
  );
}
