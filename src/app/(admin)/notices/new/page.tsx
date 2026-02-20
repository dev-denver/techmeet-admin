import { Header } from "@/components/layout/Header";
import { NoticeForm } from "@/components/features/notices/NoticeForm";

export default function NewNoticePage() {
  return (
    <>
      <Header title="공지사항 등록" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <NoticeForm />
      </main>
    </>
  );
}
