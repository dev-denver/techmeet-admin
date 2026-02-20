import { Header } from "@/components/layout/Header";
import { ProjectForm } from "@/components/features/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <Header title="프로젝트 등록" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <ProjectForm />
      </main>
    </>
  );
}
