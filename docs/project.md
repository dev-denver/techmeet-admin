# TechMeet Admin - 개발 현황

## 구현 완료

### 인프라 / 기반
- [x] Next.js 16 (App Router) + TypeScript strict
- [x] Tailwind CSS v4 + shadcn/ui (New York, Zinc)
- [x] Supabase 클라이언트 (browser / server / admin)
- [x] 환경변수 타입 안전 접근 (`lib/config/env.ts`)
- [x] 인증 미들웨어 (admin_users 검증)
- [x] 유틸리티 (cn, formatDate, formatBudget 등)
- [x] 상태 config (`lib/constants/status.ts`)
- [x] TypeScript 타입 정의 (`src/types/`)

### 인증
- [x] `/login` 페이지 (이메일/비밀번호)
- [x] `POST /api/auth/login` - 로그인 + admin 검증
- [x] `POST /api/auth/logout` - 로그아웃

### 레이아웃
- [x] `Sidebar.tsx` - 반응형 네비게이션 (데스크탑 고정, 모바일 숨김)
- [x] `Header.tsx` - 스티키 헤더 + 모바일 햄버거 메뉴
- [x] `(admin)/layout.tsx` - 관리자 영역 공통 레이아웃

### 페이지
- [x] `/dashboard` - 통계 카드 (회원수, 모집중 프로젝트, 대기 지원서, 게시 공지)
- [x] `/projects` - 프로젝트 목록 테이블
- [x] `/projects/new` - 프로젝트 등록 폼
- [x] `/projects/[id]` - 프로젝트 수정/삭제
- [x] `/users` - 사용자 목록 테이블
- [x] `/users/[id]` - 사용자 수정
- [x] `/applications` - 지원서 목록 테이블
- [x] `/applications/[id]` - 지원서 상태 변경
- [x] `/notices` - 공지사항 목록 테이블
- [x] `/notices/new` - 공지사항 등록 폼
- [x] `/notices/[id]` - 공지사항 수정/삭제
- [x] `/teams` - 팀 목록 + 팀 추가
- [x] `/alimtalk` - 알림톡 발송 내역
- [x] `/alimtalk/send` - 알림톡 발송 폼

### API Routes
- [x] `GET/POST /api/projects`
- [x] `GET/PUT/DELETE /api/projects/[id]`
- [x] `GET /api/users`
- [x] `GET/PUT/DELETE /api/users/[id]`
- [x] `GET /api/applications`
- [x] `GET/PUT /api/applications/[id]`
- [x] `GET/POST /api/notices`
- [x] `GET/PUT/DELETE /api/notices/[id]`
- [x] `GET/POST /api/teams`
- [x] `GET/PUT/DELETE /api/teams/[id]`
- [x] `GET /api/alimtalk`
- [x] `POST /api/alimtalk/send`

### DB 마이그레이션
- [x] `sql/migration_admin.sql` - 전체 마이그레이션 SQL

## 미구현 / 추후 작업

- [ ] 카카오 알림톡 실제 API 연동 (`/api/alimtalk/send`)
- [ ] 프로젝트/사용자 필터 및 검색
- [ ] 페이지네이션 (현재 전체 조회)
- [ ] TanStack Table 적용 (정렬, 필터)
- [ ] 팀원 추가/삭제 기능
- [ ] 대시보드 차트 (Recharts 등)
- [ ] 엑셀 내보내기

## 검증 체크리스트

1. `npm run dev -- -p 3001` → 빌드 오류 없음
2. `/login` 페이지 접근 → 로그인 폼 렌더링
3. 미인증 상태로 `/dashboard` 접근 → `/login` 리다이렉트
4. Supabase Dashboard에서 `sql/migration_admin.sql` 실행 → 테이블 생성 확인
5. admin_users에 테스트 계정 INSERT 후 로그인 → 대시보드 진입
6. `npm run build` → 빌드 성공
7. `npm run lint` → ESLint 오류 없음
