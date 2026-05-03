import { createClient } from "@supabase/supabase-js";

// .env.local 에서 로드 (node --env-file=.env.local scripts/create-admin.mjs)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL ?? "admin@techmeet.com";
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_INITIAL_NAME ?? "마스터 관리자";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[오류] NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  console.error("  실행 방법: node --env-file=.env.local scripts/create-admin.mjs");
  process.exit(1);
}

if (!ADMIN_PASSWORD) {
  console.error("[오류] ADMIN_INITIAL_PASSWORD 환경변수가 필요합니다.");
  console.error("  .env.local 에 아래 항목을 추가하세요:");
  console.error("  ADMIN_INITIAL_PASSWORD=your_secure_password");
  process.exit(1);
}

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
  console.log(`  권한    : superadmin`);
  console.log("  로그인  : http://localhost:3001/login");
  console.log("========================================");
}

createAdminAccount();
