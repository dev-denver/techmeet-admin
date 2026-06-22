# TechMeet Admin - 프로젝트 현황

techmeet-client(프리랜서 전용 모바일 웹앱)와 동일한 Supabase DB를 공유하는 관리자 전용 풀 반응형 웹 대시보드.

- 관리자 이메일/비밀번호 인증 (카카오 OAuth 없음)
- techmeet-client와 DB 공유, admin 전용 테이블 별도 관리

---

## 핵심 비즈니스 목적

1. **개발자 관리** - 가입된 개발자의 등급·스킬·현재 투입 프로젝트·종료 예정일 파악
2. **프로젝트 매칭** - 관리자가 등록한 프로젝트를 techmeet-client에 게시
3. **문자 발송** - 가입된 개발자에게 문자(SMS/LMS) 발송
4. **추천인 기능** - `profiles.referrer_note` 자유 텍스트 컬럼으로 관리 (관계형 추천인 구조 폐기), 사용자 목록 가입일 옆 노출 + 상세에서 수정

## 핵심 업무 흐름

1. 개발자 관리 → techmeet-client에서 등록한 사용자 목록 확인·수정·권한 관리
2. 사용자 풀 조회 → 스펙·등급 기준 가용 or 종료 임박 인원 필터링
3. 프로젝트 관리 → 관리자가 프로젝트 CRUD
4. 매칭 완료 → 사용자가 신청한 프로젝트 관리, 투입 상태 확인
5. 문자 발송 → 사용자들에게 문자 발송

---

## 사이드바 탭 구성

1. **대시보드**
   - 프로젝트 현황
   - 사용자 현황

2. **프로젝트**
   - 프로젝트 목록 조회
   - 상세 조회
   - 등록 및 수정

3. **지원서**
   - 지원자 목록 조회

4. **사용자**
   - 사용자 목록 조회 (가입일 옆 추천인 노출)
   - 사용자 정보 수정 (추천인 텍스트 포함)

5. **문자 발송** (Sendon SDK 기반 SMS/LMS, 카카오 알림톡 아님)
   - 발송 내역 조회 (내부 탭)
   - 문자 발송 하기 (내부 탭)

6. **공지사항**
   - 공지사항 CRUD (예약 공지 포함)

7. **관리자 관리** (superadmin 전용)
   - 슈퍼관리자가 관리자 계정 관리

---

## 구현 완료

- 관리자 전용 사용자 메모 (user_admin_memos 테이블, 목록 퀵에딧 다이얼로그 + 상세 편집 섹션)
- API 에러 핸들링 + zod 입력 검증 (전 라우트)
- 로딩/에러/빈 상태 UI + 확인 다이얼로그
- 목록 페이지네이션 + 검색/필터 (URL params, 서버사이드)
- 팀 멤버 관리 (CRUD)
- 프로젝트 지원자 탭 + 사용자 활동 탭
- 벌크 액션 + CSV 내보내기
- 관리자 감사 로그 (admin_audit_logs 테이블)
- 대시보드 고도화 (통계, 프로젝트 분포, 최근 활동 피드)
- 다크모드 (ThemeProvider, ThemeToggle, FOUC 방지)

## 대기 중 (Backlog)

### 문자 발송 - Sendon IP 화이트리스트 문제 (2026-06-20)

**현황**: Vercel 프로덕션에 `SENDON_ID`/`SENDON_API_KEY`/`SENDON_FROM` 환경변수가 누락되어 있던 버그와, 발송 실패가 조용히 무시되던 코드 버그는 수정·배포 완료(`route.ts`, `sendon.ts`). 이후 실제 에러 로그를 확인한 결과 근본 원인은 **Sendon API의 IP 화이트리스트 정책**:

- Sendon은 보안을 위해 API를 호출할 수 있는 발신 IP를 사전에 콘솔에서 등록해야만 호출을 허용함 (사업자회원 등록 + IP 화이트리스트 필수, CIDR 형식 지원)
- 그런데 Vercel Functions는 서버리스 구조상 고정 발신 IP가 없음 (매 호출마다 AWS 인프라 풀에서 동적 할당) → 로컬 PC IP를 등록해도 프로덕션 호출은 차단됨 (`허가되지 않은 사용자입니다. Whitelist IP 등록 후 이용해주세요.` 에러)
- Vercel의 공식 Static IP 부가기능은 비용이 약 $100/월로 이 서비스 발송량(저빈도) 대비 과도함

**해결 방향**: 고정 공인 IP를 가진 작은 VPS 1대를 "중계 서버"로 두고, Vercel 함수는 Sendon API를 직접 호출하지 않고 이 중계 서버를 거쳐 호출하도록 변경. Sendon 콘솔에는 이 중계 서버의 고정 IP만 등록.

- VPS 후보: **Oracle Cloud Always Free** (ARM VM 1대, 영구 무료, 카드 인증만 필요) 채택 — 그 외 대안으로 DigitalOcean/Vultr 최저가 droplet($4~6/월), QuotaGuard 등 고정IP 프록시 서비스($10~20/월)도 검토했으나 비용·관리 단순성 면에서 Oracle Cloud 우선

**인프라 담당자 작업 체크리스트**:
1. Oracle Cloud 계정 생성 (https://www.oracle.com/cloud/free/, Always Free 등급)
2. Compute Instance 생성 — Shape: `VM.Standard.A1.Flex` (Always Free 대상), 1 OCPU / 6GB, OS: Ubuntu 22.04 LTS, Public IP 할당 체크
3. **고정 공인 IP 전환 (중요)**: 기본 할당되는 Public IP는 Ephemeral(임시)이라 인스턴스 재시작 시 변경될 수 있음 → Networking → IP Management에서 **Reserved Public IP**로 전환해야 영구 고정됨. 이 IP를 개발 측에 전달
4. 방화벽/Security List에서 중계 서버 포트(예: 443 또는 8443) TCP 인바운드를 0.0.0.0/0으로 오픈 (Vercel 발신 IP가 매번 바뀌므로 IP 단위 제한 불가 — 대신 중계 서버 자체가 비밀 토큰으로 인증)
5. Node.js 20 LTS 설치
6. SSH 접속 정보를 개발 측에 공유 (중계 서버 코드 배포는 개발 측에서 진행)
7. 위 3번에서 확보한 고정 IP를 Sendon 웹콘솔 → API KEY 관리 → 허용 IP 관리에 등록

**개발 측 작업 (담당자 작업과 별개, 추후 진행)**:
- 중계 서버 코드 작성 (Node.js, Sendon SDK를 이 서버에서 직접 호출하는 최소 API: `/send`, `/find` 등 `src/lib/services/sendon.ts`의 함수와 동일한 역할, 비밀 토큰 헤더로 인증)
- VPS에 배포 + pm2 등으로 상시 구동 설정
- `src/lib/services/sendon.ts`가 Sendon API를 직접 호출하는 대신 이 중계 서버를 호출하도록 변경 (인터페이스는 동일하게 유지해 `route.ts` 등 호출부 변경 불필요)
- Vercel 환경변수에 중계 서버 URL + 공유 비밀 토큰 추가

**완료 후 인프라 담당자가 전달해야 할 정보**:
- 고정 공인 IP 주소
- 인스턴스 SSH 접속 정보(또는 접속 권한)

---

## DB 주요 테이블

- `profiles` - 사용자 정보 (notification\_\*, account_status, withdrawn_at, referrer_note 포함)
- `notices` - 공지사항 (start_at, end_at, notice_type 포함)
- `admin_users` - 관리자 계정
- `alimtalk_logs` - 문자 발송 내역 (테이블명은 유지, 실제로는 Sendon SMS/LMS)
- `teams` + `profile_teams` - 팀 관리
- `admin_audit_logs` - 관리자 행동 감사 로그
- `user_admin_memos` - 관리자 전용 사용자 메모 (사용자에게 비노출, service_role 전용)
