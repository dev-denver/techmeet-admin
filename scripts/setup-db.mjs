const SUPABASE_URL = "https://yuwaxjzazyaubjweftfr.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1d2F4anphenlhdWJqd2VmdGZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxMjcxMSwiZXhwIjoyMDg2OTg4NzExfQ.75b8eSHZVRSVkEF6l9qEk4qlZUZVVXcEQp6nUNYszx0";

// Supabase SQL API (postgres REST)
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Supabase Management API로 SQL 실행
async function runSQLViaManagement(sql) {
  // project ref 추출
  const projectRef = "yuwaxjzazyaubjweftfr";
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const text = await res.text();
  return { status: res.status, body: text };
}

// Supabase postgres endpoint 직접 사용
async function executeSQLDirect(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: sql }),
  });
  return { status: res.status, body: await res.text() };
}

const AUTH_USER_ID = "50c44f25-762d-4134-8d1b-f4dd21059348";
const ADMIN_EMAIL = "admin@techmeet.com";
const ADMIN_NAME = "마스터 관리자";

const MIGRATION_SQL = `
-- admin_users 테이블 생성
create table if not exists public.admin_users (
  id           uuid default gen_random_uuid() primary key,
  auth_user_id uuid references auth.users on delete cascade not null unique,
  name         text not null,
  email        text not null unique,
  role         text not null default 'admin'
    check (role in ('superadmin', 'admin')),
  created_at   timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy if not exists "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = auth_user_id);
`;

const INSERT_SQL = `
insert into public.admin_users (auth_user_id, name, email, role)
values ('${AUTH_USER_ID}', '${ADMIN_NAME}', '${ADMIN_EMAIL}', 'superadmin')
on conflict (auth_user_id) do nothing;
`;

console.log("Supabase Dashboard SQL Editor에서 아래 SQL을 실행하세요:");
console.log("URL: https://supabase.com/dashboard/project/yuwaxjzazyaubjweftfr/sql/new");
console.log("\n============================================================");
console.log(MIGRATION_SQL);
console.log(INSERT_SQL);
console.log("============================================================");
console.log("\n위 SQL 실행 후 http://localhost:3001/login 에서 로그인:");
console.log("  이메일  : admin@techmeet.com");
console.log("  비밀번호: qwer1234!");
