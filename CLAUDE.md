# TechMeet Admin - 개발 가이드

## 프로젝트 개요

techmeet-client(프리랜서 전용 모바일 웹앱)와 동일한 Supabase DB를 공유하는
관리자 전용 풀 반응형 웹 대시보드.

- 포트: 3001 (`npm run dev -- -p 3001`)
- 관리자는 이메일/비밀번호로 로그인 (카카오 OAuth 없음)
- 별도 `admin_users` 테이블로 관리자 계정 분리

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5 strict
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York, Zinc)
- **Database**: Supabase (기존 DB 공유)
- **Auth**: Supabase Auth (email/password)
- **Form**: react-hook-form + zod
- **Date**: date-fns (Korean locale)

## 디렉토리 구조

```
src/
├── app/
│   ├── (admin)/              # 인증된 관리자 영역
│   │   ├── dashboard/        # 대시보드 (통계 카드)
│   │   ├── users/            # 회원 관리 (목록, 상세/수정)
│   │   ├── projects/         # 프로젝트 관리 (목록, 생성, 상세/수정)
│   │   ├── applications/     # 지원 관리 (목록, 상세/상태변경)
│   │   ├── notices/          # 공지 관리 (목록, 생성, 상세/수정)
│   │   ├── teams/            # 팀 관리
│   │   ├── alimtalk/         # 알림톡 (로그, 발송)
│   │   └── admins/           # 관리자 계정 관리 (superadmin 전용)
│   ├── api/                  # API Routes (모두 verifyAdmin 적용)
│   ├── login/                # 로그인 페이지
│   └── layout.tsx            # 루트 레이아웃
├── components/
│   ├── ui/                   # shadcn/ui 컴포넌트
│   ├── layout/               # Sidebar, Header
│   └── features/             # 기능별 폼/리스트 컴포넌트
├── lib/
│   ├── supabase/             # client, server, admin 클라이언트
│   ├── api/verify-admin.ts   # API 관리자 검증 (verifyAdmin, verifySuperAdmin)
│   ├── config/env.ts         # 환경변수 타입 안전 접근 (lazy getter)
│   ├── constants/status.ts   # 상태 config 중앙 관리
│   └── utils/                # cn, format 유틸
├── types/                    # TypeScript 타입 정의
└── proxy.ts                  # Next.js 16 프록시 미들웨어
```

## 구현 완료 항목

### 페이지 & API

| 기능 | 페이지 | API | 비고 |
|------|--------|-----|------|
| 로그인/로그아웃 | `/login` | `auth/login`, `auth/logout` | email/password |
| 대시보드 | `/dashboard` | - | 통계 카드 (회원, 프로젝트, 지원, 공지) |
| 회원 관리 | `/users`, `/users/[id]` | `users`, `users/[id]` | 목록, 상세/수정 |
| 프로젝트 관리 | `/projects`, `/projects/new`, `/projects/[id]` | `projects`, `projects/[id]` | CRUD |
| 지원 관리 | `/applications`, `/applications/[id]` | `applications`, `applications/[id]` | 목록, 상태변경/메모 |
| 공지 관리 | `/notices`, `/notices/new`, `/notices/[id]` | `notices`, `notices/[id]` | CRUD, 즉시/예약 발행 |
| 팀 관리 | `/teams` | `teams`, `teams/[id]` | 다이얼로그 CRUD |
| 알림톡 | `/alimtalk`, `/alimtalk/send` | `alimtalk`, `alimtalk/send` | 로그, 발송 폼 |
| 관리자 관리 | `/admins`, `/admins/new` | `admins`, `admins/[id]` | superadmin 전용 |

### 공통 기능
- 인증 프록시 미들웨어 (`src/proxy.ts`)
- API 관리자 검증 (`verifyAdmin`, `verifySuperAdmin`)
- 상태 config 중앙 관리 (프로젝트, 지원, 계정, 공지, 팀, 관리자 역할)
- 날짜/금액/숫자 포맷 유틸
- 반응형 사이드바 (모바일 sheet)

## 코드 스타일

- TypeScript strict, `any` 금지
- named export 사용
- Server Component 우선, 필요 시 `'use client'`
- API Route 최상단에서 `verifyAdmin()` 호출로 관리자 검증
- 상태 config는 `lib/constants/status.ts` 중앙 관리
- Tailwind 유틸리티만 사용, 커스텀 CSS 금지

## Supabase 클라이언트 사용

| 상황 | 클라이언트 |
|------|-----------|
| Client Component | `createClient()` from `@/lib/supabase/client` |
| Server Component / API Route (인증 세션 필요) | `createServerSupabaseClient()` |
| API Route (RLS bypass 필요) | `createAdminClient()` from `@/lib/supabase/admin` |

## 인증 플로우

```
POST /api/auth/login
  → supabase.auth.signInWithPassword()
  → admin_users 테이블 확인
  → 없으면 401 / 있으면 세션 생성 → /dashboard
```

프록시 (`src/proxy.ts`):
- 모든 `/(admin)/*` 경로에서 세션 + admin_users 확인
- 미인증 → `/login` 리다이렉트
- admin_users 없음 → `/login?error=unauthorized`

## DB 마이그레이션

`sql/migration_admin.sql` 파일을 Supabase Dashboard > SQL Editor에서 실행.

### 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `admin_users` | 관리자 계정 (role: superadmin/admin) |
| `profiles` | 회원 프로필 (notification_*, account_status, withdrawn_at, referrer_id 추가) |
| `notices` | 공지사항 (start_at, end_at, notice_type 추가) |
| `alimtalk_logs` | 알림톡 발송 로그 |
| `teams` | 팀 |
| `profile_teams` | 팀 멤버십 (role: leader/member) |

## 환경변수 설정

`.env.local` 파일에 아래 값 입력 필요:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `KAKAO_ALIMTALK_APP_KEY` - 카카오 알림톡 앱 키 (선택)
- `KAKAO_ALIMTALK_SENDER_KEY` - 카카오 알림톡 발신 키 (선택)

## 개발 서버

```bash
npm run dev -- -p 3001
```
