import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeploymentProjectEditForm } from "@/components/features/deployment/DeploymentProjectEditForm";
import { DeploymentProjectMembersSection } from "@/components/features/deployment/DeploymentProjectMembersSection";
import { DeploymentProjectNoticesSection } from "@/components/features/deployment/DeploymentProjectNoticesSection";
import type { DeploymentProject, DeploymentProjectMember, DeploymentProjectNotice } from "@/types/deployment";

async function getProject(id: string): Promise<DeploymentProject | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("deployment_projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getMembers(projectId: string): Promise<DeploymentProjectMember[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("deployment_project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("seq_id", { ascending: true });
  return data ?? [];
}

async function getNotices(projectId: string): Promise<DeploymentProjectNotice[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("deployment_project_notices")
    .select("*")
    .eq("project_id", projectId)
    .order("notice_date", { ascending: false });
  return data ?? [];
}

export default async function DeploymentProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const isSm = project.type === "SM";
  const [members, notices] = await Promise.all([
    getMembers(id),
    isSm ? getNotices(id) : Promise.resolve([]),
  ]);

  const isDeleted = !!project.deleted_at;

  return (
    <>
      <Header title="프로젝트 상세" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isDeleted && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            이 프로젝트는 삭제된 상태입니다. 수정이 불가하며, 아래 기본정보 탭의 복구 버튼으로 복원할 수 있습니다.
          </div>
        )}
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members">투입 인원 ({members.length})</TabsTrigger>
            {isSm && <TabsTrigger value="notices">이관 및 공지사항 ({notices.length})</TabsTrigger>}
            <TabsTrigger value="info">기본정보</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <DeploymentProjectMembersSection projectId={id} members={members} />
          </TabsContent>

          {isSm && (
            <TabsContent value="notices" className="mt-4">
              <DeploymentProjectNoticesSection projectId={id} notices={notices} />
            </TabsContent>
          )}

          <TabsContent value="info" className="max-w-xl mt-4">
            <DeploymentProjectEditForm project={project} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
