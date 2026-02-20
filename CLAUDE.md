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
- **Date**: date-fns

## 디렉토리 구조

```
src/
├── app/
│   ├── (admin)/          # 인증된 관리자 영역
│   ├── login/            # 로그인 페이지
│   └── api/              # API Routes
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── layout/           # Sidebar, Header, AdminLayout
│   └── features/         # 기능별 컴포넌트
├── lib/
│   ├── supabase/         # client, server, admin 클라이언트
│   ├── config/env.ts     # 환경변수 타입 안전 접근
│   ├── constants/        # 상태 config
│   └── utils/            # cn, format 유틸
├── types/                # TypeScript 타입 정의
└── middleware.ts          # 인증 미들웨어
```

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

미들웨어 (`src/middleware.ts`):
- 모든 `/(admin)/*` 경로에서 세션 + admin_users 확인
- 미인증 → `/login` 리다이렉트
- admin_users 없음 → `/login?error=unauthorized`

## DB 마이그레이션

`sql/migration_admin.sql` 파일을 Supabase Dashboard > SQL Editor에서 실행.

## 환경변수 설정

`.env.local` 파일에 아래 값 입력 필요:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## 개발 서버

```bash
npm run dev -- -p 3001
```
