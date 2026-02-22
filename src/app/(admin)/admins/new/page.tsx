import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/layout/Header";
import { AdminForm } from "@/components/features/admins/AdminForm";

export default async function NewAdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const { data: currentAdmin } = await adminClient
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", user!.id)
    .single();

  if (!currentAdmin || currentAdmin.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <>
      <Header title="관리자 추가" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg">
          <AdminForm />
        </div>
      </main>
    </>
  );
}
