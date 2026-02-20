import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { ProjectForm } from "@/components/features/projects/ProjectForm";
import type { Project } from "@/types";

async function getProject(id: string): Promise<Project | null> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  return (
    <>
      <Header title="프로젝트 상세" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <ProjectForm project={project} />
      </main>
    </>
  );
}
