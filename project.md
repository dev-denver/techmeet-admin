# TechMeet Admin - 개발 현황

techmeet-client(프리랜서 전용 모바일 웹앱)와 동일한 Supabase DB를 공유하는
관리자 전용 풀 반응형 웹 대시보드.

- 포트: 3001 (`npm run dev -- -p 3001`)
- 관리자 이메일/비밀번호 인증 (카카오 OAuth 없음)
- 별도 `admin_users` 테이블로 관리자 계정 분리

## 기술 스택

- Framework: Next.js 16 (App Router)
- Language: TypeScript 5 strict
- Styling: Tailwind CSS v4 + shadcn/ui (New York, Zinc)
- Database: Supabase (techmeet-client와 동일 DB 공유)
- Auth: Supabase Auth (email/password)
- Form: react-hook-form + zod
- Date: date-fns (Korean locale)

## 디렉토리 구조

```
src/
├── app/
│   ├── (admin)/              # 인증된 관리자 영역
│   │   ├── dashboard/        # 통계 카드 + 분포 차트 + 피드
│   │   ├── users/            # 회원 목록 + 상세/수정 (탭)
│   │   ├── projects/         # 프로젝트 CRUD + 일괄 처리
│   │   ├── applications/     # 지원서 목록 + 상태변경/메모
│   │   ├── notices/          # 공지 CRUD (즉시/예약 발행)
│   │   ├── teams/            # 팀 CRUD + 팀원 관리
│   │   ├── alimtalk/         # 알림톡 로그 + 발송 폼
│   │   ├── admins/           # 관리자 계정 관리 (superadmin 전용)
│   │   └── audit-logs/       # 관리자 활동 로그 조회
│   ├── api/                  # API Routes (모두 verifyAdmin 적용)
│   ├── login/                # 로그인 페이지
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn/ui + 공통 컴포넌트
│   ├── layout/               # Sidebar, Header
│   └── features/             # 기능별 폼/리스트 컴포넌트
├── lib/
│   ├── supabase/             # client / server / admin 클라이언트
│   ├── api/
│   │   ├── verify-admin.ts   # verifyAdmin, verifySuperAdmin
│   │   ├── response.ts       # apiSuccess, apiError, parseBody 등
│   │   ├── schemas.ts        # zod 입력 검증 스키마 (전 라우트)
│   │   └── audit.ts          # logAudit() → admin_audit_logs 기록
│   ├── config/env.ts         # 환경변수 타입 안전 접근 (lazy getter)
│   ├── constants/status.ts   # 상태 config 중앙 관리
│   └── utils/                # cn, format 유틸
├── types/                    # TypeScript 타입 정의
└── proxy.ts                  # Next.js 16 프록시 미들웨어
```

## 구현 완료

### 인프라 / 기반

- [x] Next.js 16 App Router + TypeScript strict
- [x] Tailwind CSS v4 + shadcn/ui (New York, Zinc)
- [x] Supabase 클라이언트 3종 (browser / server / admin)
- [x] 환경변수 타입 안전 접근 (`lib/config/env.ts`, lazy getter)
- [x] 인증 프록시 미들웨어 (`src/proxy.ts`)
- [x] API 공통 응답 헬퍼 (`apiSuccess`, `apiError`, `parseBody`)
- [x] zod 입력 검증 스키마 (`lib/api/schemas.ts`)
- [x] 감사 로그 헬퍼 (`lib/api/audit.ts` → `admin_audit_logs`)
- [x] 상태 config 중앙 관리 (`lib/constants/status.ts`)
- [x] TypeScript 타입 정의 (`src/types/`)
- [x] 날짜/금액/숫자 포맷 유틸
- [x] 다크 모드 (ThemeProvider + ThemeToggle, FOUC 방지)

### 인증

- [x] `/login` - 이메일/비밀번호 로그인
- [x] `POST /api/auth/login` - signInWithPassword + admin_users 검증
- [x] `POST /api/auth/logout` - 세션 삭제
- [x] 프록시: 미인증 → `/login`, admin_users 없음 → `/login?error=unauthorized`

### 레이아웃

- [x] `Sidebar.tsx` - 반응형 (데스크탑 고정, 모바일 sheet)
- [x] `Header.tsx` - 스티키 + 모바일 햄버거 + 다크 모드 토글
- [x] `(admin)/layout.tsx` - 공통 레이아웃

### 페이지 & API

| 기능 | 페이지 | API | 주요 기능 |
|------|--------|-----|-----------|
| 대시보드 | `/dashboard` | - | 통계 카드 4개, 프로젝트 상태 분포 바, 최근 가입·지원·관리자 활동 피드, 게시중 공지 수 |
| 회원 | `/users` | `GET /api/users` | 목록 (이름·이메일·연락처 검색, 상태 필터, 페이지네이션, CSV 내보내기) |
| 회원 상세 | `/users/[id]` | `GET/PUT/DELETE /api/users/[id]` | 기본정보 수정 탭, 지원이력 탭, 소속팀 탭; DELETE = 소프트 탈퇴 |
| 프로젝트 | `/projects` | `GET/POST /api/projects` | 목록 (검색·상태 필터·페이지네이션), 일괄 상태변경/삭제, CSV 내보내기 |
| 프로젝트 상세 | `/projects/new`, `/projects/[id]` | `GET/PUT/DELETE /api/projects/[id]`, `PATCH/DELETE /api/projects/bulk` | CRUD, 일괄 처리 |
| 지원서 | `/applications` | `GET /api/applications` | 목록 (상태 필터, 페이지네이션), 일괄 상태변경 |
| 지원서 상세 | `/applications/[id]` | `GET/PUT /api/applications/[id]`, `PATCH /api/applications/bulk` | 상태변경, 메모 수정 |
| 공지사항 | `/notices` | `GET/POST /api/notices` | 목록 (제목 검색, 게시상태 필터, 페이지네이션), 중요 공지 표시 |
| 공지사항 상세 | `/notices/new`, `/notices/[id]` | `GET/PUT/DELETE /api/notices/[id]` | CRUD, 즉시/예약 발행, 게시 기간 설정 |
| 팀 | `/teams` | `GET/POST /api/teams` | 목록 + 다이얼로그 CRUD |
| 팀 상세 | `/teams/[id]` | `GET/PUT/DELETE /api/teams/[id]`, `POST /api/teams/[id]/members` | 팀원 추가(role 지정)·제거 |
| 알림톡 | `/alimtalk` | `GET /api/alimtalk` | 발송 로그 목록 |
| 알림톡 발송 | `/alimtalk/send` | `POST /api/alimtalk/send` | 발송 폼 (개인/전체, 즉시/예약); DB 로그 기록만, 실제 API 미연동 |
| 관리자 | `/admins` | `GET/POST /api/admins`, `DELETE /api/admins/[id]` | 목록·추가·삭제 (superadmin 전용) |
| 활동 로그 | `/audit-logs` | `GET /api/audit-logs` | 전체 관리자 활동 로그 (액션·리소스 필터, 페이지네이션) |
| CSV 내보내기 | - | `GET /api/export?type=` | users / projects / applications (UTF-8 BOM) |

### 공통 UI 컴포넌트

- [x] `ListFilter` - URL 파라미터 기반 검색 + 다중 Select 필터
- [x] `PaginationControls` - URL 파라미터 기반 서버사이드 페이지네이션
- [x] `BulkActions` - 체크박스 다중 선택 → 일괄 상태변경/삭제
- [x] `ExportButton` - CSV 내보내기 버튼
- [x] `ConfirmDialog` - 삭제 등 위험 작업 확인 다이얼로그
- [x] `DataTableSkeleton` - 로딩 스켈레톤
- [x] `EmptyState` - 데이터 없음 상태
- [x] `PageError` - 에러 상태

## 클라이언트 앱 연동 포인트

techmeet-client에서 발생하는 데이터 중 관리자가 처리해야 하는 항목:

| 클라이언트 기능 | 관리자 대응 | 구현 상태 |
|----------------|------------|---------|
| 회원 가입 (카카오 OAuth) | 회원 목록·상세 조회 | ✅ 완료 |
| 계정 상태 (`active`/`withdrawn`) | 상세에서 상태 변경, 탈퇴일 표시 | ✅ 완료 |
| 알림 설정 (`notification_*`) | 상세에서 조회·수정 | ✅ 완료 |
| 프로젝트 등록 | 관리자가 CRUD 직접 관리 | ✅ 완료 |
| 지원 흐름 (`pending→reviewing→interview→accepted/rejected`) | 상태변경 + 메모 | ✅ 완료 |
| 가용성 (`availability_status`: available/partial/unavailable) | Profile 타입에 있으나 수정 UI 미노출 | ❌ 미노출 |
| 추천인 (`referrer_id`) | Profile 타입에 있으나 수정 UI 미노출 (관리자만 변경 가능) | ❌ 미노출 |
| 알림톡 (신규 프로젝트, 지원 상태 변경) | 발송 폼 + 로그 (실제 API 미연동) | ⚠️ 부분 완료 |

## TODO

- [ ] **알림톡 실제 API 연동** - 현재 `POST /api/alimtalk/send`는 DB 로그 기록만 수행, Kakao vendor 미선정
- [ ] **회원 상세 - 추천인(`referrer_id`) 편집** - 클라이언트 앱에서 관리자만 변경 가능하므로 admin UI 필요
- [ ] **회원 상세 - 가용성(`availability_status`) 조회/수정** - 클라이언트의 3단계 토글 상태를 관리자가 override
- [ ] **관리자 비밀번호 변경** - 현재 계정 삭제 후 재생성으로만 가능

## 코드 스타일

- TypeScript strict, `any` 금지 (복잡한 Supabase 조인 결과 제외)
- named export 사용
- Server Component 우선, 필요 시 `'use client'`
- API Route 최상단에서 `verifyAdmin()` 호출
- 상태 config는 `lib/constants/status.ts`에서 중앙 관리
- Tailwind 유틸리티만 사용, 커스텀 CSS 금지
- `useSearchParams()`는 반드시 `<Suspense>` 래핑

## Supabase 클라이언트 사용

| 상황 | 클라이언트 |
|------|-----------|
| Client Component | `createClient()` from `@/lib/supabase/client` |
| Server Component / API (세션 필요) | `createServerSupabaseClient()` |
| API Route (RLS bypass 필요) | `createAdminClient()` from `@/lib/supabase/admin` |

## API 응답 포맷

성공: `{ success: true, data: T }`
실패: `{ success: false, error: { message: string, code?: string, details?: unknown } }`
프론트 에러 참조: `data.error?.message` (not `data.message`)

## DB 테이블

`sql/migration_admin.sql`을 Supabase Dashboard > SQL Editor에서 실행.

| 테이블 | 설명 |
|--------|------|
| `profiles` | 회원 프로필 (`notification_*`, `account_status`, `withdrawn_at`, `referrer_id` 추가) |
| `projects` | 프로젝트 |
| `applications` | 지원서 (`admin_memo` 포함) |
| `notices` | 공지사항 (`is_published`, `start_at`, `end_at`, `notice_type` 추가) |
| `admin_users` | 관리자 계정 (role: superadmin/admin) |
| `alimtalk_logs` | 알림톡 발송 로그 |
| `teams` | 팀 |
| `profile_teams` | 팀 멤버십 (role: leader/member) |
| `admin_audit_logs` | 관리자 활동 감사 로그 |

## 환경변수

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
KAKAO_ALIMTALK_APP_KEY=      # 선택 (알림톡 연동 시)
KAKAO_ALIMTALK_SENDER_KEY=   # 선택 (알림톡 연동 시)
```

## 개발 환경

```bash
npm run dev -- -p 3001    # 개발 서버
npm run build             # 프로덕션 빌드
npm run lint              # ESLint
```

## 초기 설정 체크리스트

1. Supabase Dashboard에서 `sql/migration_admin.sql` 실행
2. Authentication > Users에서 관리자 계정 생성 (이메일/비밀번호)
3. migration_admin.sql 하단 주석 해제 후 auth_user_id 입력 → `admin_users` INSERT
4. `.env.local` 환경변수 설정
5. `npm run dev -- -p 3001` → `/login` 로그인 확인
