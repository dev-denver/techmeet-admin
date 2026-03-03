-- ============================================================
-- techmeet-admin DB 마이그레이션 v2
-- Supabase Dashboard > SQL Editor에서 실행
-- 신규 빈 프로젝트에서 한 번 실행하면 모든 테이블이 생성됨
-- ============================================================


-- 0. 기반 테이블 생성 (techmeet-client 앱과 공유)
--    신규 Supabase에는 없으므로 IF NOT EXISTS로 먼저 생성
-- ============================================================

-- profiles
create table if not exists public.profiles (
  id                               uuid        default gen_random_uuid() primary key,
  auth_user_id                     uuid        references auth.users on delete cascade not null unique,
  name                             text        not null,
  email                            text        not null,
  phone                            text,
  bio                              text,
  headline                         text,
  tech_stack                       text[]      not null default array[]::text[],
  experience_years                 integer,
  portfolio_url                    text,
  avatar_url                       text,
  kakao_id                         text,
  availability_status              text,
  notification_new_project         boolean     not null default true,
  notification_application_update  boolean     not null default true,
  notification_marketing           boolean     not null default false,
  account_status                   text        not null default 'active'
    check (account_status in ('active', 'withdrawn')),
  withdrawn_at                     timestamptz,
  referrer_id                      uuid        references public.profiles(id) on delete set null,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- projects
create table if not exists public.projects (
  id               uuid        default gen_random_uuid() primary key,
  title            text        not null,
  description      text        not null default '',
  status           text        not null default 'recruiting'
    check (status in ('recruiting', 'in_progress', 'completed', 'cancelled')),
  budget_min       numeric,
  budget_max       numeric,
  budget_currency  text        not null default 'KRW',
  duration_start_date date,
  duration_end_date   date,
  deadline         date,
  tech_stack       text[]      not null default array[]::text[],
  requirements     text[],
  category         text,
  client_name      text,
  project_type     text,
  work_type        text,
  location         text,
  headcount        integer,
  created_by       uuid        references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.projects enable row level security;

-- notices
create table if not exists public.notices (
  id           uuid        default gen_random_uuid() primary key,
  title        text        not null,
  content      text        not null default '',
  is_published boolean     not null default false,
  is_important boolean     not null default false,
  notice_type  text        not null default 'immediate'
    check (notice_type in ('immediate', 'scheduled')),
  start_at     timestamptz,
  end_at       timestamptz,
  created_by   uuid        references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.notices enable row level security;

-- applications
create table if not exists public.applications (
  id                   uuid        default gen_random_uuid() primary key,
  project_id           uuid        references public.projects(id) on delete cascade not null,
  freelancer_id        uuid        references public.profiles(id) on delete cascade not null,
  status               text        not null default 'pending'
    check (status in ('pending', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn')),
  cover_letter         text,
  expected_rate        numeric,
  available_start_date date,
  admin_memo           text,
  applied_at           timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (project_id, freelancer_id)
);
alter table public.applications enable row level security;

-- careers
create table if not exists public.careers (
  id           uuid        default gen_random_uuid() primary key,
  profile_id   uuid        references public.profiles(id) on delete cascade not null,
  company      text        not null,
  role         text        not null,
  start_date   date        not null,
  end_date     date,
  is_current   boolean     not null default false,
  description  text,
  tech_stack   text[]      not null default array[]::text[],
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check ((is_current = false) or (is_current = true and end_date is null))
);
alter table public.careers enable row level security;


-- 1. admin_users 테이블 (신규)
-- ============================================================
create table if not exists public.admin_users (
  id           uuid        default gen_random_uuid() primary key,
  auth_user_id uuid        references auth.users on delete cascade not null unique,
  name         text        not null,
  email        text        not null unique,
  role         text        not null default 'admin'
    check (role in ('superadmin', 'admin')),
  created_at   timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- 관리자 본인만 자신 조회 가능 (서버는 service_role 사용)
create policy "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = auth_user_id);


-- 2. alimtalk_logs 테이블 (신규)
-- ============================================================
create table if not exists public.alimtalk_logs (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references public.profiles(id) on delete set null,
  template_code text        not null,
  template_name text        not null,
  service_type  text        not null check (service_type in ('project', 'notice', 'individual')),
  message_id    text,
  send_type     text        not null default 'immediate'
    check (send_type in ('immediate', 'scheduled')),
  scheduled_at  timestamptz,
  is_success    boolean,
  sent_at       timestamptz,
  error_message text,
  created_at    timestamptz not null default now()
);

alter table public.alimtalk_logs enable row level security;
-- service_role 전용 접근 (RLS 정책 없음 = 일반 유저 접근 불가)


-- 3. teams / profile_teams 테이블 (신규)
-- ============================================================
create table if not exists public.teams (
  id          uuid        default gen_random_uuid() primary key,
  name        text        not null,
  description text        not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.profile_teams (
  id         uuid        default gen_random_uuid() primary key,
  profile_id uuid        references public.profiles(id) on delete cascade not null,
  team_id    uuid        references public.teams(id) on delete cascade not null,
  role       text        not null default 'member' check (role in ('leader', 'member')),
  joined_at  timestamptz not null default now(),
  unique (profile_id, team_id)
);

alter table public.teams        enable row level security;
alter table public.profile_teams enable row level security;
-- service_role 전용 (관리자 API Route에서 service_role 클라이언트 사용)


-- 4. admin_audit_logs 테이블 (신규)
-- ============================================================
create table if not exists public.admin_audit_logs (
  id          uuid        default gen_random_uuid() primary key,
  admin_id    uuid        references public.admin_users(id) on delete set null,
  admin_name  text        not null,
  action      text        not null,
  resource    text        not null,
  resource_id text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;
-- service_role 전용


-- 5. 성능 인덱스
-- ============================================================

-- profiles (auth_user_id UNIQUE constraint already creates an implicit index)
create index if not exists idx_profiles_created_at          on public.profiles(created_at desc);
create index if not exists idx_profiles_account_status      on public.profiles(account_status);
create index if not exists idx_profiles_availability_status on public.profiles(availability_status);

-- projects
create index if not exists idx_projects_created_at        on public.projects(created_at desc);
create index if not exists idx_projects_status            on public.projects(status);

-- applications
create index if not exists idx_applications_status        on public.applications(status);
create index if not exists idx_applications_freelancer_id on public.applications(freelancer_id);
create index if not exists idx_applications_project_id    on public.applications(project_id);
create index if not exists idx_applications_applied_at    on public.applications(applied_at desc);

-- notices
create index if not exists idx_notices_created_at         on public.notices(created_at desc);

-- teams
create index if not exists idx_teams_created_at           on public.teams(created_at desc);

-- alimtalk_logs
create index if not exists idx_alimtalk_created_at        on public.alimtalk_logs(created_at desc);
create index if not exists idx_alimtalk_user_id           on public.alimtalk_logs(user_id);
create index if not exists idx_alimtalk_service_type      on public.alimtalk_logs(service_type);
create index if not exists idx_alimtalk_is_success        on public.alimtalk_logs(is_success);

-- admin_audit_logs
create index if not exists idx_audit_logs_created_at      on public.admin_audit_logs(created_at desc);
create index if not exists idx_audit_logs_admin_id        on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_resource        on public.admin_audit_logs(resource);

-- careers
create index if not exists idx_careers_profile_id         on public.careers(profile_id);


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
