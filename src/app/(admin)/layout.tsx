import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/layout/AdminShell";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-context";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[Layout] auth.getUser() error:", authError.message);
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();
  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("name, role")
    .eq("auth_user_id", user.id)
    .single();

  if (adminError) {
    console.error("[Layout] admin_users query error:", adminError.message);
    redirect("/login?error=server_error");
  }

  if (!adminUser) {
    redirect("/login?error=unauthorized");
  }

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get(SIDEBAR_COOKIE)?.value === "true";

  return (
    <>
      <AdminShell
        adminRole={adminUser.role as "superadmin" | "admin"}
        defaultCollapsed={defaultCollapsed}
      >
        {children}
      </AdminShell>
      <Toaster position="top-center" richColors />
    </>
  );
}
