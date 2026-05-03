// .env.local 에서 로드 (node --env-file=.env.local scripts/setup-db.mjs)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] ?? "<project-ref>";
const ADMIN_EMAIL = process.env.ADMIN_INITIAL_EMAIL ?? "admin@techmeet.com";
const ADMIN_NAME = process.env.ADMIN_INITIAL_NAME ?? "마스터 관리자";

const AUTH_USER_ID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

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
console.log(`URL: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log("\n============================================================");
console.log(MIGRATION_SQL);
console.log(INSERT_SQL);
console.log("============================================================");
console.log("\n위 SQL 실행 후 http://localhost:3001/login 에서 로그인:");
console.log(`  이메일  : ${ADMIN_EMAIL}`);
console.log("  비밀번호: .env.local 의 ADMIN_INITIAL_PASSWORD 값");
