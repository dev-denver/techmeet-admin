-- ============================================================
-- techmeet DB 스키마 (최종본)
-- admin + client 공용 스키마 (신규 Supabase 프로젝트 기준)
-- Supabase Dashboard > SQL Editor에서 실행
--
-- 테이블 구성:
--   [CLIENT]  1. profiles          — 프리랜서 프로필 (id = auth.users.id) / client CRUD
--             2. careers           — 경력 / client CRUD
--             3. educations        — 학력 / client CRUD
--             4. certifications    — 자격증 / client CRUD
--             5. skill_inventories — 스킬 인벤토리 (프로젝트 경험) / client CRUD
--
--   [SHARED]  6. projects          — 프로젝트 / admin 관리, client 읽기
--             7. notices           — 공지사항 (예약 공지 포함) / admin 관리, client 읽기
--
--   [CLIENT]  8. applications      — 지원 내역 / client CRUD (projects FK로 인해 SHARED 이후 정의)
--
--   [ADMIN]   9. admin_users       — 관리자 계정
--            10. alimtalk_templates — 카카오 알림톡 서식
--            11. alimtalk_logs     — 카카오 알림톡 발송 이력
--            12. admin_audit_logs  — 관리자 감사 로그
--
-- 설계 원칙:
--   - profiles.id = auth.users.id (client 코드 호환)
--   - admin_users는 별도 UUID PK + auth_user_id FK 구조
--   - RLS: client 앱은 anon key + JWT, admin API는 service_role로 RLS 우회
--   - [ADMIN] 테이블은 RLS 활성화 + 정책 없음 = service_role 전용
--   - 비즈니스 유효성 검사(날짜 역전·값 범위 등)는 API zod 스키마에서 처리
--   - seq_id: Supabase Realtime 내부 순서 관리 컬럼 (generated always as identity)
-- ============================================================


-- ============================================================
-- 유틸리티: updated_at 자동 갱신 트리거 함수
-- ============================================================
create or replace function public.set_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- [CLIENT] 클라이언트 테이블
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles (프리랜서 프로필)
-- ------------------------------------------------------------
-- profiles.id = auth.users.id (auth FK를 PK로 직접 사용)
-- client 회원가입 시 id: data.user.id 로 upsert하므로 gen_random_uuid() 불필요

create table if not exists public.profiles (
  id                               uuid        references auth.users(id) on delete cascade primary key, -- 고유 식별자 (auth.users.id 동일)
  name                             text        not null,                                                  -- 이름
  email                            text        not null,                                                  -- 이메일
  phone                            text,                                                                  -- 전화번호
  bio                              text,                                                                  -- 자기소개
  tech_stack                       text[]      not null default array[]::text[],                          -- 기술 스택
  experience_years                 integer,                                                               -- 경력 연수
  experience_months                integer     not null default 0                                         -- 경력 개월수 (0~11)
    check (experience_months >= 0 and experience_months <= 11),
  kakao_id                         text,                                                                  -- 카카오 ID
  availability_status              text                                                                   -- 투입 가능 상태 (available/partial/unavailable)
    check (availability_status in ('available', 'partial', 'unavailable')),
  available_from_date              date,                                                                  -- 투입 가능 시작일
  notification_new_project         boolean     not null default true,                                     -- 새 프로젝트 알림 수신 여부
  notification_application_update  boolean     not null default true,                                     -- 지원 상태 변경 알림 수신 여부
  notification_marketing           boolean     not null default false,                                    -- 마케팅 알림 수신 여부
  account_status                   text        not null default 'active'                                  -- 계정 상태 (active/withdrawn)
    check (account_status in ('active', 'withdrawn')),
  withdrawn_at                     timestamptz,                                                           -- 탈퇴 일시
  referrer_id                      uuid        references public.profiles(id) on delete set null,         -- 추천인 프로필 ID
  birth_date                       date,                                                                  -- 생년월일
  gender                           text                                                                   -- 성별 (male/female)
    check (gender in ('male', 'female')),
  joining_date                     date,                                                                  -- 가입일 (커뮤니티 등록 기준)
  affiliation                      text,                                                                  -- 소속사/소속 회사
  department                       text,                                                                  -- 부서
  position_title                   text,                                                                  -- 직함/직위
  military_service                 text,                                                                  -- 병역 사항
  address                          text,                                                                  -- 주소
  seq_id                           bigint      generated always as identity unique,                       -- Supabase Realtime 순서 관리 (자동)
  created_at                       timestamptz not null default now(),                                    -- 생성 일시
  updated_at                       timestamptz not null default now()                                     -- 수정 일시
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회/수정 가능
-- ※ 회원가입/재가입/추천인 검색 등 admin 작업은 모두 service_role로 수행 (RLS 우회)
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 2. careers (경력)
-- ------------------------------------------------------------
create table if not exists public.careers (
  id          uuid        default gen_random_uuid() primary key,                            -- 고유 식별자
  profile_id  uuid        references public.profiles(id) on delete cascade not null,        -- 프로필 ID
  company     text        not null,                                                         -- 회사명
  role        text        not null,                                                         -- 직무
  start_date  date        not null,                                                         -- 시작일
  end_date    date,                                                                         -- 종료일
  is_current  boolean     not null default false,                                           -- 현재 재직 여부
  description text,                                                                         -- 업무 설명
  tech_stack  text[]      not null default array[]::text[],                                 -- 사용 기술 스택
  seq_id      bigint      generated always as identity unique,                              -- Supabase Realtime 순서 관리 (자동)
  created_at  timestamptz not null default now(),                                           -- 생성 일시
  updated_at  timestamptz not null default now(),                                           -- 수정 일시
  check ((is_current = false) or (is_current = true and end_date is null))
);

alter table public.careers enable row level security;

-- 본인 경력만 CRUD
create policy "careers_select_own" on public.careers
  for select using (auth.uid() = profile_id);

create policy "careers_insert_own" on public.careers
  for insert with check (auth.uid() = profile_id);

create policy "careers_update_own" on public.careers
  for update using (auth.uid() = profile_id);

create policy "careers_delete_own" on public.careers
  for delete using (auth.uid() = profile_id);

create trigger careers_updated_at
  before update on public.careers
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 3. educations (학력)
-- ------------------------------------------------------------
create table if not exists public.educations (
  id           uuid        default gen_random_uuid() primary key,                           -- 고유 식별자
  profile_id   uuid        references public.profiles(id) on delete cascade not null,       -- 프로필 ID
  school_name  text        not null,                                                        -- 학교명
  degree       text,                                                                        -- 학위 (학사/석사/박사 등)
  major        text,                                                                        -- 전공
  start_date   date,                                                                        -- 입학일
  end_date     date,                                                                        -- 졸업일
  is_graduated boolean     not null default true,                                           -- 졸업 여부
  created_at   timestamptz not null default now(),                                          -- 생성 일시
  updated_at   timestamptz not null default now()                                           -- 수정 일시
);

alter table public.educations enable row level security;

-- 본인 학력만 CRUD
create policy "educations_select_own" on public.educations
  for select using (auth.uid() = profile_id);

create policy "educations_insert_own" on public.educations
  for insert with check (auth.uid() = profile_id);

create policy "educations_update_own" on public.educations
  for update using (auth.uid() = profile_id);

create policy "educations_delete_own" on public.educations
  for delete using (auth.uid() = profile_id);

create trigger educations_updated_at
  before update on public.educations
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 4. certifications (자격증)
-- ------------------------------------------------------------
create table if not exists public.certifications (
  id            uuid        default gen_random_uuid() primary key,                          -- 고유 식별자
  profile_id    uuid        references public.profiles(id) on delete cascade not null,      -- 프로필 ID
  name          text        not null,                                                        -- 자격증명
  acquired_date date,                                                                       -- 취득일
  created_at    timestamptz not null default now(),                                         -- 생성 일시
  updated_at    timestamptz not null default now()                                          -- 수정 일시
);

alter table public.certifications enable row level security;

-- 본인 자격증만 CRUD
create policy "certifications_select_own" on public.certifications
  for select using (auth.uid() = profile_id);

create policy "certifications_insert_own" on public.certifications
  for insert with check (auth.uid() = profile_id);

create policy "certifications_update_own" on public.certifications
  for update using (auth.uid() = profile_id);

create policy "certifications_delete_own" on public.certifications
  for delete using (auth.uid() = profile_id);

create trigger certifications_updated_at
  before update on public.certifications
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 5. skill_inventories (스킬 인벤토리 - 프로젝트 경험)
-- ------------------------------------------------------------
create table if not exists public.skill_inventories (
  id            uuid        default gen_random_uuid() primary key,                          -- 고유 식별자
  profile_id    uuid        references public.profiles(id) on delete cascade not null,      -- 프로필 ID
  project_name  text        not null,                                                        -- 프로젝트명
  start_date    date,                                                                       -- 시작일
  end_date      date,                                                                       -- 종료일
  client        text,                                                                       -- 클라이언트명
  company       text,                                                                       -- 소속 회사
  industry      text,                                                                       -- 산업군
  application   text,                                                                       -- 적용 시스템/서비스
  role          text,                                                                       -- 역할
  hardware_type text,                                                                       -- 하드웨어 유형
  os            text,                                                                       -- 운영체제
  languages     text[]      not null default array[]::text[],                               -- 사용 언어
  dbms          text,                                                                       -- DBMS
  tools         text[]      not null default array[]::text[],                               -- 사용 도구
  others        text,                                                                       -- 기타 사항
  sort_order    integer     not null default 0,                                             -- 정렬 순서
  created_at    timestamptz not null default now(),                                         -- 생성 일시
  updated_at    timestamptz not null default now()                                          -- 수정 일시
);

alter table public.skill_inventories enable row level security;

-- 본인 스킬 인벤토리만 CRUD
create policy "skill_inventories_select_own" on public.skill_inventories
  for select using (auth.uid() = profile_id);

create policy "skill_inventories_insert_own" on public.skill_inventories
  for insert with check (auth.uid() = profile_id);

create policy "skill_inventories_update_own" on public.skill_inventories
  for update using (auth.uid() = profile_id);

create policy "skill_inventories_delete_own" on public.skill_inventories
  for delete using (auth.uid() = profile_id);

create trigger skill_inventories_updated_at
  before update on public.skill_inventories
  for each row execute function public.set_updated_at();


-- ============================================================
-- [SHARED] 공유 테이블 (admin 관리 / client 읽기)
-- ============================================================

-- ------------------------------------------------------------
-- 6. projects (프로젝트)
-- ------------------------------------------------------------
create table if not exists public.projects (
  id                  uuid        default gen_random_uuid() primary key,                    -- 고유 식별자
  title               text        not null,                                                 -- 프로젝트명
  description         text        not null default '',                                      -- 프로젝트 설명
  status              text        not null default 'recruiting'                             -- 진행 상태 (recruiting/in_progress/completed/cancelled)
    check (status in ('recruiting', 'in_progress', 'completed', 'cancelled')),
  duration_start_date date,                                                                 -- 프로젝트 시작일
  duration_end_date   date,                                                                 -- 프로젝트 종료일
  deadline            date,                                                                 -- 지원 마감일
  tech_stack          text[]      not null default array[]::text[],                         -- 요구 기술 스택
  requirements        text[],                                                               -- 요구 사항
  category            text,                                                                 -- 카테고리
  client_name         text,                                                                 -- 클라이언트명
  project_type        text                                                                  -- 프로젝트 유형 (web/mobile/backend/fullstack/data/design/other)
    check (project_type in ('web', 'mobile', 'backend', 'fullstack', 'data', 'design', 'other')),
  work_type           text                                                                  -- 근무 형태 (remote/onsite/hybrid)
    check (work_type in ('remote', 'onsite', 'hybrid')),
  location            text,                                                                 -- 근무 위치
  headcount           integer,                                                              -- 모집 인원
  is_visible          boolean     not null default true,                                    -- 노출 여부
  created_by          uuid        references public.profiles(id) on delete set null,        -- 등록 관리자 프로필 ID
  seq_id              bigint      generated always as identity unique,                      -- Supabase Realtime 순서 관리 (자동)
  deleted_at          timestamptz,                                                          -- soft delete 일시
  created_at          timestamptz not null default now(),                                   -- 생성 일시
  updated_at          timestamptz not null default now()                                    -- 수정 일시
);

alter table public.projects enable row level security;

-- 인증된 사용자는 전체 프로젝트 조회 가능 (상태 필터는 client 앱 레이어에서 처리)
create policy "projects_select_authenticated" on public.projects
  for select using (auth.role() = 'authenticated');

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 7. notices (공지사항)
-- ------------------------------------------------------------
create table if not exists public.notices (
  id           uuid        default gen_random_uuid() primary key,                           -- 고유 식별자
  title        text        not null,                                                        -- 제목
  content      text        not null default '',                                             -- 내용
  is_published boolean     not null default false,                                          -- 게시 여부
  is_important boolean     not null default false,                                          -- 중요 공지 여부
  notice_type  text        not null default 'immediate'                                     -- 공지 유형 (immediate/scheduled)
    check (notice_type in ('immediate', 'scheduled')),
  start_at     timestamptz,                                                                 -- 게시 시작 일시 (예약 공지)
  end_at       timestamptz,                                                                 -- 게시 종료 일시 (예약 공지)
  created_by   uuid        references public.profiles(id) on delete set null,               -- 작성 관리자 프로필 ID
  seq_id       bigint      generated always as identity unique,                             -- Supabase Realtime 순서 관리 (자동)
  deleted_at   timestamptz,                                                                 -- soft delete 일시
  attachments  jsonb       not null default '[]'::jsonb,                                   -- 첨부파일 (JSON 배열)
  created_at   timestamptz not null default now(),                                          -- 생성 일시
  updated_at   timestamptz not null default now()                                           -- 수정 일시
);

alter table public.notices enable row level security;

-- 게시된 공지사항만 노출:
--   is_published = true (관리자가 공개 처리)
--   + immediate: 시간 제한 없음
--   + scheduled: start_at ~ end_at 범위 내
-- ※ client 코드에 is_published 필터 없으므로 RLS에서 강제 적용
create policy "notices_select_published" on public.notices
  for select using (
    auth.role() = 'authenticated'
    and is_published = true
    and (
      notice_type = 'immediate'
      or (
        (start_at is null or start_at <= now())
        and (end_at   is null or end_at   >= now())
      )
    )
  );

create trigger notices_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 8. applications (지원) [CLIENT — projects FK로 인해 SHARED 이후 정의]
-- ------------------------------------------------------------
create table if not exists public.applications (
  id                   uuid        default gen_random_uuid() primary key,                               -- 고유 식별자
  project_id           uuid        references public.projects(id) on delete cascade not null,           -- 지원 프로젝트 ID
  freelancer_id        uuid        references public.profiles(id) on delete cascade not null,           -- 지원자 프로필 ID
  status               text        not null default 'pending'                                           -- 지원 상태 (pending/reviewing/interview/accepted/rejected/withdrawn)
    check (status in ('pending', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn')),
  cover_letter         text,                                                                             -- 지원서 내용
  expected_rate        numeric,                                                                          -- 희망 단가
  available_start_date date,                                                                             -- 투입 가능일 (admin 전용)
  admin_memo           text,                                                                             -- 관리자 메모 (admin 전용)
  applied_at           timestamptz not null default now(),                                               -- 지원 일시
  seq_id               bigint      generated always as identity unique,                                  -- Supabase Realtime 순서 관리 (자동)
  created_at           timestamptz not null default now(),                                               -- 생성 일시
  updated_at           timestamptz not null default now(),                                               -- 수정 일시
  unique (project_id, freelancer_id)
);

alter table public.applications enable row level security;

-- 본인 지원 내역만 CRUD
-- ※ 관리자 상태 변경(reviewing/interview/accepted/rejected)은 service_role로 수행
create policy "applications_select_own" on public.applications
  for select using (auth.uid() = freelancer_id);

create policy "applications_insert_own" on public.applications
  for insert with check (auth.uid() = freelancer_id);

-- pending → withdrawn 취소만 허용
create policy "applications_update_own" on public.applications
  for update
  using  (auth.uid() = freelancer_id and status = 'pending')
  with check (status = 'withdrawn');

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();


-- ============================================================
-- [ADMIN] 관리자 전용 테이블 (service_role 전용 — RLS 활성화 + 정책 없음)
-- ============================================================

-- ------------------------------------------------------------
-- 9. admin_users (관리자 계정)
-- ------------------------------------------------------------
-- profiles와 달리 별도 UUID PK + auth_user_id FK 구조 유지
-- (관리자 계정은 프리랜서 profiles와 완전히 분리)

create table if not exists public.admin_users (
  id           uuid        default gen_random_uuid() primary key,                          -- 고유 식별자
  auth_user_id uuid        references auth.users on delete cascade not null unique,        -- Supabase Auth 유저 UUID
  name         text        not null,                                                        -- 관리자 이름
  email        text        not null unique,                                                 -- 관리자 이메일
  phone        text,                                                                        -- 관리자 전화번호
  role         text        not null default 'admin'                                         -- 권한 (superadmin/admin)
    check (role in ('superadmin', 'admin')),
  seq_id       bigint      generated always as identity unique,                             -- Supabase Realtime 순서 관리 (자동)
  created_at   timestamptz not null default now(),                                          -- 생성 일시
  updated_at   timestamptz not null default now()                                           -- 수정 일시
);

alter table public.admin_users enable row level security;

-- 관리자 본인 조회만 허용 (서버는 service_role 사용)
create policy "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = auth_user_id);

create trigger admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 10. alimtalk_templates (카카오 알림톡 서식)
-- ------------------------------------------------------------
create table if not exists public.alimtalk_templates (
  id           uuid        default gen_random_uuid() primary key,                           -- 고유 식별자
  code         text        not null unique,                                                 -- 서식 코드 (고유)
  name         text        not null,                                                        -- 서식명
  body         text        not null default '',                                             -- 메시지 본문 템플릿
  variables    text[]      not null default array[]::text[],                                -- 치환 변수 목록
  service_type text        not null                                                         -- 발송 대상 유형 (project/notice/individual/all)
    check (service_type in ('project', 'notice', 'individual', 'all')),
  is_active    boolean     not null default true,                                           -- 사용 여부
  seq_id       bigint      generated always as identity unique,                             -- Supabase Realtime 순서 관리 (자동)
  created_at   timestamptz not null default now(),                                          -- 생성 일시
  updated_at   timestamptz not null default now()                                           -- 수정 일시
);

alter table public.alimtalk_templates enable row level security;
-- service_role 전용

create trigger alimtalk_templates_updated_at
  before update on public.alimtalk_templates
  for each row execute function public.set_updated_at();


-- ------------------------------------------------------------
-- 11. alimtalk_logs (카카오 알림톡 발송 이력)
-- ------------------------------------------------------------
create table if not exists public.alimtalk_logs (
  id            uuid        default gen_random_uuid() primary key,                          -- 고유 식별자
  user_id       uuid        references public.profiles(id) on delete set null,              -- 수신자 프로필 ID
  template_code text        not null,                                                       -- 사용 서식 코드
  template_name text        not null,                                                       -- 사용 서식명
  service_type  text        not null check (service_type in ('project', 'notice', 'individual')), -- 발송 유형
  message_id    text,                                                                       -- 카카오 메시지 ID
  send_type     text        not null default 'immediate'                                    -- 발송 방식 (immediate/scheduled)
    check (send_type in ('immediate', 'scheduled')),
  scheduled_at  timestamptz,                                                                -- 예약 발송 일시
  is_success    boolean,                                                                    -- 발송 성공 여부
  sent_at       timestamptz,                                                                -- 실제 발송 일시
  error_message text,                                                                       -- 오류 메시지
  seq_id        bigint      generated always as identity unique,                            -- Supabase Realtime 순서 관리 (자동)
  created_at    timestamptz not null default now()                                          -- 생성 일시
);

alter table public.alimtalk_logs enable row level security;

-- 본인 수신 이력 조회 허용
create policy "alimtalk_logs_select_own" on public.alimtalk_logs
  for select using (user_id = auth.uid());

-- alimtalk_logs.template_code → alimtalk_templates.code
alter table public.alimtalk_logs
  add constraint alimtalk_logs_template_fk
  foreign key (template_code)
  references public.alimtalk_templates(code)
  on delete restrict;


-- ------------------------------------------------------------
-- 12. admin_audit_logs (관리자 감사 로그)
-- ------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id          uuid        default gen_random_uuid() primary key,                            -- 고유 식별자
  admin_id    uuid        references public.admin_users(id) on delete set null,             -- 관리자 ID
  admin_name  text        not null,                                                         -- 관리자 이름 (비정규화)
  action      text        not null,                                                         -- 수행 액션
  resource    text        not null,                                                         -- 대상 리소스
  resource_id text,                                                                         -- 대상 리소스 ID
  details     jsonb,                                                                        -- 상세 데이터 (JSON)
  ip_address  text,                                                                         -- 요청 IP 주소
  user_agent  text,                                                                         -- 요청 브라우저 정보
  seq_id      bigint      generated always as identity unique,                              -- Supabase Realtime 순서 관리 (자동)
  created_at  timestamptz not null default now()                                            -- 생성 일시
);

alter table public.admin_audit_logs enable row level security;
-- service_role 전용


-- ============================================================
-- 성능 인덱스
-- ============================================================

-- [CLIENT] profiles
create index if not exists idx_profiles_created_at          on public.profiles(created_at desc);
create index if not exists idx_profiles_email               on public.profiles(email);
create index if not exists idx_profiles_account_status      on public.profiles(account_status);
create index if not exists idx_profiles_availability_status on public.profiles(availability_status);
create index if not exists idx_profiles_kakao_id            on public.profiles(kakao_id);
create index if not exists idx_profiles_referrer_id         on public.profiles(referrer_id);

-- [CLIENT] careers
create index if not exists idx_careers_profile_id           on public.careers(profile_id);

-- [CLIENT] applications
create index if not exists idx_applications_applied_at      on public.applications(applied_at desc);
create index if not exists idx_applications_status          on public.applications(status);
create index if not exists idx_applications_freelancer_id   on public.applications(freelancer_id);
create index if not exists idx_applications_project_id      on public.applications(project_id);

-- [SHARED] projects
create index if not exists idx_projects_created_at          on public.projects(created_at desc);
create index if not exists idx_projects_status              on public.projects(status);
create index if not exists idx_projects_deadline            on public.projects(deadline);
create index if not exists idx_projects_category            on public.projects(category);
create index if not exists projects_is_visible_idx          on public.projects(is_visible);
create index if not exists projects_deleted_at_idx          on public.projects(deleted_at);

-- [SHARED] notices
create index if not exists idx_notices_created_at           on public.notices(created_at desc);
create index if not exists idx_notices_is_published         on public.notices(is_published);

-- [ADMIN] alimtalk_templates
create index if not exists idx_alimtalk_templates_code         on public.alimtalk_templates(code);
create index if not exists idx_alimtalk_templates_service_type on public.alimtalk_templates(service_type);
create index if not exists idx_alimtalk_templates_is_active    on public.alimtalk_templates(is_active);

-- [ADMIN] alimtalk_logs
create index if not exists idx_alimtalk_created_at          on public.alimtalk_logs(created_at desc);
create index if not exists idx_alimtalk_sent_at             on public.alimtalk_logs(sent_at);
create index if not exists idx_alimtalk_user_id             on public.alimtalk_logs(user_id);
create index if not exists idx_alimtalk_template_code       on public.alimtalk_logs(template_code);
create index if not exists idx_alimtalk_service_type        on public.alimtalk_logs(service_type);
create index if not exists idx_alimtalk_is_success          on public.alimtalk_logs(is_success);

-- [ADMIN] admin_audit_logs
create index if not exists idx_audit_logs_created_at        on public.admin_audit_logs(created_at desc);
create index if not exists idx_audit_logs_admin_id          on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_resource          on public.admin_audit_logs(resource);
create index if not exists idx_audit_logs_action            on public.admin_audit_logs(action);


-- ============================================================
-- 마스터 관리자 계정 등록
-- ============================================================
-- ※ 사전 준비:
--   1. Supabase Dashboard > Authentication > Users 에서
--      관리자 이메일/비밀번호로 Auth 계정을 먼저 생성
--   2. 생성된 유저의 UUID를 아래 auth_user_id에 입력 후 실행
-- ============================================================
-- insert into public.admin_users (auth_user_id, name, email, role)
-- values (
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Auth 유저 UUID 입력
--   '마스터 관리자',
--   'admin@techmeet.com',
--   'superadmin'
-- ) on conflict (auth_user_id) do nothing;
