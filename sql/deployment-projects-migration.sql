-- ============================================================
-- 투입현황 재설계: 프로젝트 1급 엔티티화 (2026-06-20)
-- 기존 deployment_sm_members / deployment_si_members / deployment_sm_notices
-- 는 DROP 후 신규 구조로 교체 (운영 데이터 마이그레이션 없음, 사용자 확정)
-- ============================================================

drop table if exists public.deployment_sm_notices;
drop table if exists public.deployment_sm_members;
drop table if exists public.deployment_si_members;

create table public.deployment_projects (
  id          uuid        primary key default gen_random_uuid(),
  seq_id      bigint      generated always as identity unique,
  name        text        not null,
  type        text        not null check (type in ('SI', 'SM')),
  status      text        not null default 'active' check (status in ('active', 'closed')),
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.deployment_projects enable row level security;

create trigger deployment_projects_updated_at
  before update on public.deployment_projects
  for each row execute function public.set_updated_at();

create table public.deployment_project_members (
  id          uuid        primary key default gen_random_uuid(),
  seq_id      bigint      generated always as identity unique,
  project_id  uuid        not null references public.deployment_projects(id) on delete cascade,
  name        text        not null,
  part        text,
  detail_work text,
  grade       text        check (grade in ('초급', '중급', '고급', '특급')),
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.deployment_project_members enable row level security;

create index deployment_project_members_project_id_idx
  on public.deployment_project_members(project_id);

create trigger deployment_project_members_updated_at
  before update on public.deployment_project_members
  for each row execute function public.set_updated_at();

create table public.deployment_project_notices (
  id              uuid        primary key default gen_random_uuid(),
  seq_id          bigint      generated always as identity unique,
  project_id      uuid        not null references public.deployment_projects(id) on delete cascade,
  transfer_notice text        not null,
  notice_date     date        not null,
  main_manager    text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.deployment_project_notices enable row level security;

create index deployment_project_notices_project_id_idx
  on public.deployment_project_notices(project_id);

create trigger deployment_project_notices_updated_at
  before update on public.deployment_project_notices
  for each row execute function public.set_updated_at();
