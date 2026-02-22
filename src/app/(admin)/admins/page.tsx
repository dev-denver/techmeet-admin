import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { AdminList } from "@/components/features/admins/AdminList";
import { Plus } from "lucide-react";
import type { AdminUser } from "@/types";

async function getAdmins(): Promise<AdminUser[]> {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("admin_users")
    .select("id, auth_user_id, name, email, role, created_at")
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminUser[];
}

export default async function AdminsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: currentAdmin } = await adminClient
    .from("admin_users")
    .select("id, role")
    .eq("auth_user_id", user!.id)
    .single();

  // superadmin이 아니면 대시보드로 리다이렉트
  if (!currentAdmin || currentAdmin.role !== "superadmin") {
    redirect("/dashboard");
  }

  const admins = await getAdmins();

  return (
    <>
      <Header title="관리자 관리" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">총 {admins.length}명</p>
          <Button asChild size="sm">
            <Link href="/admins/new">
              <Plus className="h-4 w-4 mr-2" />
              관리자 추가
            </Link>
          </Button>
        </div>

        <AdminList admins={admins} currentAdminId={currentAdmin.id} />
      </main>
    </>
  );
}
