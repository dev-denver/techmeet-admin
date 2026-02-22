-- ============================================================
-- techmeet-admin DB 마이그레이션
-- Supabase Dashboard > SQL Editor에서 실행
-- 신규 빈 프로젝트에서 한 번 실행하면 모든 테이블이 생성됨
-- ============================================================


-- 0. 기반 테이블 생성 (techmeet-client 앱과 공유)
--    신규 Supabase에는 없으므로 IF NOT EXISTS로 먼저 생성
-- ============================================================

-- profiles
create table if not exists public.profiles (
  id             uuid default gen_random_uuid() primary key,
  auth_user_id   uuid references auth.users on delete cascade not null unique,
  name           text not null,
  email          text not null,
  phone          text,
  bio            text,
  skills         text[] not null default array[]::text[],
  career_years   integer,
  portfolio_url  text,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- projects
create table if not exists public.projects (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  description  text not null default '',
  status       text not null default 'draft'
    check (status in ('draft','open','in_review','in_progress','completed','cancelled')),
  budget_min   numeric,
  budget_max   numeric,
  start_date   date,
  end_date     date,
  skills       text[] not null default array[]::text[],
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.projects enable row level security;

-- notices
create table if not exists public.notices (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  content     text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.notices enable row level security;

-- applications (admin_memo 포함)
create table if not exists public.applications (
  id                   uuid default gen_random_uuid() primary key,
  project_id           uuid references public.projects(id) on delete cascade not null,
  profile_id           uuid references public.profiles(id) on delete cascade not null,
  status               text not null default 'pending'
    check (status in ('pending','reviewed','accepted','rejected','withdrawn')),
  cover_letter         text,
  expected_budget      numeric,
  available_start_date date,
  admin_memo           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (project_id, profile_id)
);
alter table public.applications enable row level security;


-- 1. profiles 테이블 누락 컬럼 추가 (admin 전용)
-- ============================================================
alter table public.profiles
  add column if not exists notification_new_project        boolean not null default true,
  add column if not exists notification_application_update boolean not null default true,
  add column if not exists notification_marketing          boolean not null default false,
  add column if not exists account_status                  text    not null default 'active'
    check (account_status in ('active', 'withdrawn')),
  add column if not exists withdrawn_at   timestamptz,
  add column if not exists referrer_id    uuid references public.profiles(id) on delete set null;


-- 2. notices 테이블 누락 컬럼 추가
-- ============================================================
alter table public.notices
  add column if not exists is_published boolean not null default false,
  add column if not exists start_at     timestamptz,
  add column if not exists end_at       timestamptz,
  add column if not exists notice_type  text not null default 'immediate'
    check (notice_type in ('immediate', 'scheduled'));


-- 2-1. projects 테이블 누락 컬럼 추가
-- ============================================================
alter table public.projects
  add column if not exists category text;


-- 3. admin_users 테이블 (신규)
-- ============================================================
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

-- 관리자 본인만 자신 조회 가능 (서버는 service_role 사용)
create policy "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = auth_user_id);


-- 4. alimtalk_logs 테이블 (신규)
-- ============================================================
create table if not exists public.alimtalk_logs (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.profiles(id) on delete set null,
  template_code   text not null,
  template_name   text not null,
  service_type    text not null check (service_type in ('project', 'notice', 'individual')),
  message_id      text,
  send_type       text not null default 'immediate'
    check (send_type in ('immediate', 'scheduled')),
  scheduled_at    timestamptz,
  is_success      boolean,
  sent_at         timestamptz,
  error_message   text,
  created_at      timestamptz not null default now()
);

alter table public.alimtalk_logs enable row level security;
-- service_role 전용 접근 (RLS 정책 없음 = 일반 유저 접근 불가)


-- 5. teams / profile_teams 테이블 (신규)
-- ============================================================
create table if not exists public.teams (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.profile_teams (
  id          uuid default gen_random_uuid() primary key,
  profile_id  uuid references public.profiles(id) on delete cascade not null,
  team_id     uuid references public.teams(id) on delete cascade not null,
  role        text not null default 'member' check (role in ('leader', 'member')),
  joined_at   timestamptz not null default now(),
  unique (profile_id, team_id)
);

alter table public.teams        enable row level security;
alter table public.profile_teams enable row level security;
-- service_role 전용 (관리자 API Route에서 service_role 클라이언트 사용)


-- 6. admin_audit_logs 테이블 (신규)
-- ============================================================
create table if not exists public.admin_audit_logs (
  id           uuid default gen_random_uuid() primary key,
  admin_id     uuid references public.admin_users(id) on delete set null,
  admin_name   text not null,
  action       text not null,
  resource     text not null,
  resource_id  text,
  details      jsonb,
  created_at   timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;
-- service_role 전용

create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_resource on public.admin_audit_logs(resource);


-- ============================================================
-- 마스터 관리자 계정 등록
-- ============================================================
-- ※ 사전 준비: Supabase Dashboard > Authentication > Users 에서
--   관리자 이메일/비밀번호로 Auth 계정을 먼저 생성하세요.
--   생성 후 해당 유저의 UUID를 아래 auth_user_id에 입력하고 실행하세요.
-- ============================================================
-- insert into public.admin_users (auth_user_id, name, email, role)
-- values (
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Auth 유저 UUID 입력
--   '마스터 관리자',
--   'admin@techmeet.com',
--   'superadmin'
-- ) on conflict (auth_user_id) do nothing;
