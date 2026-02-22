import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (!adminUser) {
    redirect("/login?error=unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar adminRole={adminUser.role as "superadmin" | "admin"} />
      </aside>

      {/* 메인 콘텐츠 영역 - 사이드바 너비만큼 패딩 */}
      <div className="flex flex-col flex-1 md:pl-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}
