# TechMeet Admin - 개발 가이드

> **읽는 순서: 이 파일(CLAUDE.md) → project.md**
> 이 파일은 변경이 거의 없는 개발 규칙·아키텍처 기준입니다.
> 비즈니스 요건·기능 구성·사이드바 구조는 `project.md`를 확인하세요.

## 프로젝트 개요

techmeet-client(프리랜서 전용 모바일 웹앱)와 동일한 Supabase DB를 공유하는
관리자 전용 풀 반응형 웹 대시보드.

- 포트: 3001 (`npm run dev -- -p 3001`)
- 관리자는 이메일/비밀번호로 로그인 (카카오 OAuth 없음)
- 별도 `admin_users` 테이블로 관리자 계정 분리
- 기능 요건은 `project.md` 참조

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
│   │   ├── users/            # 회원 관리 (목록, 상세/수정, 추천인 관리)
│   │   ├── projects/         # 프로젝트 관리 (목록, 생성, 상세/수정)
│   │   ├── applications/     # 지원 관리 (목록, 상세/상태변경)
│   │   ├── notices/          # 공지 관리 (목록, 생성, 상세/수정, 예약 공지)
│   │   ├── teams/            # 팀 관리
│   │   ├── alimtalk/         # 알림톡 (발송 내역, 서식 관리, 발송)
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
│   ├── api/
│   │   ├── verify-admin.ts   # 관리자 검증 (verifyAdmin, verifySuperAdmin)
│   │   ├── response.ts       # 표준 API 응답 (apiSuccess, apiError, parseBody)
│   │   ├── schemas.ts        # zod 입력 검증 스키마
│   │   └── audit.ts          # 감사 로그 헬퍼 (admin_audit_logs 기록)
│   ├── config/env.ts         # 환경변수 타입 안전 접근 (lazy getter)
│   ├── constants/status.ts   # 상태 config 중앙 관리
│   └── utils/                # cn, format 유틸
├── types/                    # TypeScript 타입 정의
└── proxy.ts                  # Next.js 16 프록시 미들웨어
```

## 코드 스타일

- TypeScript strict, `any` 금지
- named export 사용
- Server Component 우선, 필요 시 `'use client'`
- API Route 최상단에서 `verifyAdmin()` 호출로 관리자 검증
- 상태 config는 `lib/constants/status.ts` 중앙 관리
- Tailwind 유틸리티만 사용, 커스텀 CSS 금지

## API 패턴

모든 API Route는 다음 구조를 따른다.

```ts
// 1. 관리자 검증 (최상단 필수)
const admin = await verifyAdmin()

// 2. 입력 파싱 + zod 검증
const body = await parseBody(request, mySchema)

// 3. 비즈니스 로직

// 4. 표준 응답
return apiSuccess(data)
return apiError('메시지', 'ERROR_CODE', 400)
```

**응답 형식**
```json
{ "success": true, "data": ... }
{ "success": false, "error": { "message": "...", "code": "...", "details": ... } }
```

프론트엔드 에러 접근: `data.error?.message` (`data.message` 아님)

## Supabase 클라이언트 사용

| 상황                                          | 클라이언트                                        |
| --------------------------------------------- | ------------------------------------------------- |
| Client Component                              | `createClient()` from `@/lib/supabase/client`     |
| Server Component / API Route (인증 세션 필요) | `createServerSupabaseClient()`                    |
| API Route (RLS bypass 필요)                   | `createAdminClient()` from `@/lib/supabase/admin` |

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

## 기술 주의사항

- **Next.js 16**: middleware 대신 `src/proxy.ts`, `export async function proxy()` 형태
- **zod + react-hook-form**: `z.coerce.number().nullable()` → TypeScript 오류 발생, `z.union([z.number(), z.null()])` 사용
- **useSearchParams()**: 반드시 `<Suspense>` boundary로 감싸야 함
- **Supabase join**: 결과가 객체 대신 배열로 반환될 수 있음, 복잡한 join은 `any` 타입 허용
- **환경변수**: `lib/config/env.ts`의 lazy getter 방식으로 빌드 타임 오류 방지
- **shadcn cn**: `src/lib/utils.ts`에 있음, `src/lib/utils/cn.ts`는 재export

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
