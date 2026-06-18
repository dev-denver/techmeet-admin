import { Header } from "@/components/layout/Header";
import { AlimtalkTemplateForm } from "@/components/features/alimtalk/AlimtalkTemplateForm";

export default function NewAlimtalkTemplatePage() {
  return (
    <>
      <Header title="템플릿 등록" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl">
        <AlimtalkTemplateForm />
      </main>
    </>
  );
}
