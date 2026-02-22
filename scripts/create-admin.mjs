import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yuwaxjzazyaubjweftfr.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d2F4anphenlhdWJqd2VmdGZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxMjcxMSwiZXhwIjoyMDg2OTg4NzExfQ.75b8eSHZVRSVkEF6l9qEk4qlZUZVVXcEQp6nUNYszx0";

const ADMIN_EMAIL = "admin@techmeet.com";
const ADMIN_PASSWORD = "qwer1234!";
const ADMIN_NAME = "마스터 관리자";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAdminAccount() {
  console.log("1. 기존 계정 확인...");

  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === ADMIN_EMAIL
  );

  let authUserId;

  if (existingUser) {
    console.log(`  기존 Auth 계정 발견: ${existingUser.id}`);
    authUserId = existingUser.id;

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      existingUser.id,
      { password: ADMIN_PASSWORD, email_confirm: true }
    );
    if (updateError) {
      console.error("  비밀번호 업데이트 실패:", updateError.message);
    } else {
      console.log("  비밀번호 업데이트 완료");
    }
  } else {
    console.log("2. Supabase Auth 계정 생성...");
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      console.error("  Auth 계정 생성 실패:", authError.message);
      process.exit(1);
    }

    authUserId = authData.user.id;
    console.log(`  Auth 계정 생성 완료: ${authUserId}`);
  }

  console.log("3. admin_users 테이블 등록...");

  const { data: existingAdmin } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (existingAdmin) {
    console.log("  이미 admin_users에 등록된 계정입니다.");
  } else {
    const { error: insertError } = await adminClient
      .from("admin_users")
      .insert({
        auth_user_id: authUserId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: "superadmin",
      });

    if (insertError) {
      console.error("  admin_users 등록 실패:", insertError.message);
      console.log("\n  [!] SQL을 Supabase Dashboard에서 직접 실행하세요:");
      console.log(`
insert into public.admin_users (auth_user_id, name, email, role)
values ('${authUserId}', '${ADMIN_NAME}', '${ADMIN_EMAIL}', 'superadmin');
      `);
      process.exit(1);
    }

    console.log("  admin_users 등록 완료!");
  }

  console.log("\n========================================");
  console.log("마스터 관리자 계정 생성 완료!");
  console.log("========================================");
  console.log(`  이메일  : ${ADMIN_EMAIL}`);
  console.log(`  비밀번호: ${ADMIN_PASSWORD}`);
  console.log(`  권한    : superadmin`);
  console.log("  로그인  : http://localhost:3001/login");
  console.log("========================================");
}

createAdminAccount();
