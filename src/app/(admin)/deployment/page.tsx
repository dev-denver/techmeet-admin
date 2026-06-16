import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { DeploymentTabs } from "@/components/features/deployment/DeploymentTabs";
import type { SmMember, SmNotice, SiMember } from "@/types/deployment";

async function getData() {
  const adminClient = createAdminClient();
  const [smMembersResult, smNoticesResult, siMembersResult] = await Promise.all([
    adminClient
      .from("deployment_sm_members")
      .select("*")
      .order("seq_id", { ascending: true }),
    adminClient
      .from("deployment_sm_notices")
      .select("*")
      .order("notice_date", { ascending: false }),
    adminClient
      .from("deployment_si_members")
      .select("*")
      .order("seq_id", { ascending: true }),
  ]);

  return {
    smMembers: (smMembersResult.data ?? []) as SmMember[],
    smNotices: (smNoticesResult.data ?? []) as SmNotice[],
    siMembers: (siMembersResult.data ?? []) as SiMember[],
  };
}

export default async function DeploymentPage() {
  const { smMembers, smNotices, siMembers } = await getData();

  return (
    <>
      <Header title="투입현황" />
      <main className="flex-1 overflow-y-auto p-6">
        <Suspense>
          <DeploymentTabs
            smMembers={smMembers}
            smNotices={smNotices}
            siMembers={siMembers}
          />
        </Suspense>
      </main>
    </>
  );
}
