import { Header } from "@/components/layout/Header";
import { AlimtalkSendForm } from "@/components/features/alimtalk/AlimtalkSendForm";
import { AlimtalkNav } from "@/components/features/alimtalk/AlimtalkNav";

export default function AlimtalkSendPage() {
  return (
    <>
      <Header title="알림톡" />
      <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
        <AlimtalkNav />
        <AlimtalkSendForm />
      </main>
    </>
  );
}
