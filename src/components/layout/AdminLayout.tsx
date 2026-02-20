import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  adminName?: string;
}

export function AdminLayout({ children, title, adminName }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col flex-1 md:pl-64 min-h-screen">
        <Header title={title} adminName={adminName} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
