import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { TeamMemberManager } from "@/components/features/teams/TeamMemberManager";
import { ArrowLeft } from "lucide-react";
import type { ProfileTeam } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

async function getTeam(id: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("teams")
    .select(`
      *,
      members:profile_teams(
        id, role, joined_at, profile_id,
        profile:profiles(id, name, email)
      )
    `)
    .eq("id", id)
    .single();

  return data;
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const team = await getTeam(id);

  if (!team) notFound();

  return (
    <>
      <Header title={`팀: ${team.name}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/teams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              팀 목록
            </Link>
          </Button>
        </div>

        {team.description && (
          <p className="text-sm text-muted-foreground mb-6">{team.description}</p>
        )}

        <TeamMemberManager
          teamId={team.id}
          teamName={team.name}
          members={(team.members ?? []) as ProfileTeam[]}
        />
      </main>
    </>
  );
}
