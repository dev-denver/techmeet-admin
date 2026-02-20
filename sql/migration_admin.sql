-- ============================================================
-- techmeet-admin DB 마이그레이션
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

-- 1. profiles 테이블 누락 컬럼 추가
-- ============================================================
alter table public.profiles
  add column if not exists notification_new_project        boolean not null default true,
  add column if not exists notification_application_update boolean not null default true,
  add column if not exists notification_marketing          boolean not null default false,
  add column if not exists account_status                  text    not null default 'active'
    check (account_status in ('active', 'withdrawn')),
  add column if not exists withdrawn_at   timestamptz,
  add column if not exists referrer_id    uuid references public.profiles(id) on delete set null;


-- 2. notices 테이블 스케줄링 컬럼 추가
-- ============================================================
alter table public.notices
  add column if not exists start_at     timestamptz,
  add column if not exists end_at       timestamptz,
  add column if not exists notice_type  text not null default 'immediate'
    check (notice_type in ('immediate', 'scheduled'));


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


-- ============================================================
-- 테스트 관리자 계정 삽입 예시 (실행 전 auth.users에 계정 생성 필요)
-- ============================================================
-- 1. Supabase Auth > Add user로 관리자 이메일/비밀번호 계정 생성
-- 2. 생성된 user id 확인 후 아래 INSERT 실행
--
-- insert into public.admin_users (auth_user_id, name, email, role)
-- values (
--   'auth-user-uuid-here',
--   '관리자 이름',
--   'admin@example.com',
--   'superadmin'
-- );
