import { Header } from "@/components/layout/Header";
import { AlimtalkSendForm } from "@/components/features/alimtalk/AlimtalkSendForm";

export default function AlimtalkSendPage() {
  return (
    <>
      <Header title="알림톡 발송" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <AlimtalkSendForm />
      </main>
    </>
  );
}
