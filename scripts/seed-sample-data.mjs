/**
 * 샘플 데이터 시드 스크립트
 * 실행: node --env-file=.env.local scripts/seed-sample-data.mjs
 *
 * 삽입 대상:
 *   - profiles (auth.users 포함) 30건
 *   - 추천인 관계 12건 (referrer_id 설정)
 *   - projects 30건
 *   - notices 30건
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[오류] NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  console.error("  실행 방법: node --env-file=.env.local scripts/seed-sample-data.mjs");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────
// 샘플 데이터 정의
// ──────────────────────────────────────────────────────────────

const USERS = [
  { name: "김민준", email: "minjun.kim@techmeet.dev", tech: ["React", "TypeScript", "Next.js"], years: 5, months: 3, avail: "available", gender: "male" },
  { name: "이서연", email: "seoyeon.lee@techmeet.dev", tech: ["Vue.js", "JavaScript", "Nuxt.js"], years: 3, months: 7, avail: "partial", gender: "female" },
  { name: "박도현", email: "dohyun.park@techmeet.dev", tech: ["Java", "Spring Boot", "MySQL"], years: 7, months: 1, avail: "unavailable", gender: "male" },
  { name: "최지우", email: "jiwoo.choi@techmeet.dev", tech: ["Python", "Django", "PostgreSQL"], years: 4, months: 9, avail: "available", gender: "female" },
  { name: "정우진", email: "woojin.jung@techmeet.dev", tech: ["Flutter", "Dart", "Firebase"], years: 2, months: 5, avail: "available", gender: "male" },
  { name: "강하은", email: "haeun.kang@techmeet.dev", tech: ["iOS", "Swift", "Objective-C"], years: 6, months: 0, avail: "partial", gender: "female" },
  { name: "조현우", email: "hyunwoo.jo@techmeet.dev", tech: ["Android", "Kotlin", "Jetpack Compose"], years: 5, months: 8, avail: "available", gender: "male" },
  { name: "윤소희", email: "sohee.yun@techmeet.dev", tech: ["Node.js", "Express", "MongoDB"], years: 3, months: 2, avail: "unavailable", gender: "female" },
  { name: "임태양", email: "taeyang.im@techmeet.dev", tech: ["Go", "gRPC", "Docker", "Kubernetes"], years: 8, months: 4, avail: "available", gender: "male" },
  { name: "한나연", email: "nayeon.han@techmeet.dev", tech: ["UI/UX", "Figma", "React"], years: 4, months: 6, avail: "partial", gender: "female" },
  { name: "오준혁", email: "junhyuk.oh@techmeet.dev", tech: ["AWS", "Terraform", "DevOps"], years: 9, months: 0, avail: "available", gender: "male" },
  { name: "신예린", email: "yerin.shin@techmeet.dev", tech: ["React", "Redux", "GraphQL"], years: 3, months: 11, avail: "available", gender: "female" },
  { name: "권성민", email: "sungmin.kwon@techmeet.dev", tech: ["Spring Boot", "JPA", "Redis"], years: 6, months: 5, avail: "partial", gender: "male" },
  { name: "나유진", email: "yujin.na@techmeet.dev", tech: ["Python", "FastAPI", "Machine Learning"], years: 5, months: 3, avail: "available", gender: "female" },
  { name: "문재원", email: "jaewon.moon@techmeet.dev", tech: ["React Native", "TypeScript", "Expo"], years: 4, months: 1, avail: "unavailable", gender: "male" },
  { name: "배소영", email: "soyoung.bae@techmeet.dev", tech: ["Next.js", "Prisma", "tRPC"], years: 2, months: 8, avail: "available", gender: "female" },
  { name: "류태민", email: "taemin.ryu@techmeet.dev", tech: ["C++", "Embedded", "RTOS"], years: 10, months: 2, avail: "available", gender: "male" },
  { name: "안지현", email: "jihyun.ahn@techmeet.dev", tech: ["Data Analysis", "Pandas", "Tableau"], years: 4, months: 7, avail: "partial", gender: "female" },
  { name: "유승준", email: "seungjun.yoo@techmeet.dev", tech: ["Rust", "WebAssembly", "C"], years: 7, months: 9, avail: "available", gender: "male" },
  { name: "전다은", email: "daeun.jeon@techmeet.dev", tech: ["Vue.js", "Laravel", "PHP"], years: 3, months: 0, avail: "available", gender: "female" },
  { name: "홍민성", email: "minsung.hong@techmeet.dev", tech: ["Kotlin", "Spring Webflux", "Kafka"], years: 6, months: 3, avail: "unavailable", gender: "male" },
  { name: "노은지", email: "eunji.no@techmeet.dev", tech: ["Angular", "TypeScript", "RxJS"], years: 5, months: 6, avail: "available", gender: "female" },
  { name: "장민호", email: "minho.jang@techmeet.dev", tech: ["GCP", "BigQuery", "Airflow"], years: 8, months: 1, avail: "partial", gender: "male" },
  { name: "서지은", email: "jieun.seo@techmeet.dev", tech: ["Ruby on Rails", "PostgreSQL", "Heroku"], years: 4, months: 4, avail: "available", gender: "female" },
  { name: "공현석", email: "hyunseok.kong@techmeet.dev", tech: ["React", "Three.js", "WebGL"], years: 3, months: 10, avail: "available", gender: "male" },
  { name: "민서아", email: "seoa.min@techmeet.dev", tech: ["iOS", "SwiftUI", "Combine"], years: 5, months: 2, avail: "partial", gender: "female" },
  { name: "성준영", email: "junyoung.sung@techmeet.dev", tech: ["Scala", "Spark", "Hadoop"], years: 9, months: 5, avail: "available", gender: "male" },
  { name: "채수빈", email: "subin.chae@techmeet.dev", tech: ["Nuxt.js", "Storybook", "Cypress"], years: 3, months: 6, avail: "unavailable", gender: "female" },
  { name: "표재훈", email: "jaehoon.pyo@techmeet.dev", tech: ["DevOps", "Jenkins", "Ansible"], years: 7, months: 8, avail: "available", gender: "male" },
  { name: "기하린", email: "harin.ki@techmeet.dev", tech: ["Flutter", "Firebase", "Dart"], years: 2, months: 3, avail: "available", gender: "female" },
];

const PROJECTS = [
  { title: "핀테크 플랫폼 백엔드 개발", type: "backend", work: "hybrid", loc: "서울 강남구", status: "recruiting", stack: ["Java", "Spring Boot", "MySQL", "Redis"], headcount: 2, client: "페이테크(주)" },
  { title: "쇼핑몰 프론트엔드 리뉴얼", type: "web", work: "remote", loc: null, status: "recruiting", stack: ["React", "TypeScript", "Next.js"], headcount: 1, client: "스타일커머스" },
  { title: "헬스케어 앱 개발 (iOS/Android)", type: "mobile", work: "onsite", loc: "경기 판교", status: "in_progress", stack: ["Flutter", "Dart", "Firebase"], headcount: 3, client: "헬스링크" },
  { title: "AI 추천 시스템 구축", type: "data", work: "remote", loc: null, status: "recruiting", stack: ["Python", "TensorFlow", "FastAPI"], headcount: 2, client: "리코멘더" },
  { title: "ERP 시스템 풀스택 개발", type: "fullstack", work: "onsite", loc: "서울 구로구", status: "in_progress", stack: ["Vue.js", "Spring Boot", "Oracle"], headcount: 4, client: "신한시스템즈" },
  { title: "물류 관리 시스템 백엔드 고도화", type: "backend", work: "hybrid", loc: "인천", status: "completed", stack: ["Go", "gRPC", "PostgreSQL", "Kafka"], headcount: 2, client: "물류플러스" },
  { title: "관광 앱 UX/UI 리디자인", type: "design", work: "remote", loc: null, status: "recruiting", stack: ["Figma", "React", "TypeScript"], headcount: 1, client: "트래블허브" },
  { title: "블록체인 기반 NFT 마켓플레이스", type: "fullstack", work: "remote", loc: null, status: "recruiting", stack: ["Solidity", "Next.js", "ethers.js"], headcount: 2, client: "넥스트토큰" },
  { title: "기업 HR 솔루션 SaaS 개발", type: "web", work: "hybrid", loc: "서울 마포구", status: "in_progress", stack: ["React", "Node.js", "MongoDB"], headcount: 3, client: "HR솔루션즈" },
  { title: "스마트팩토리 IoT 데이터 파이프라인", type: "data", work: "onsite", loc: "경남 창원", status: "recruiting", stack: ["Python", "Airflow", "ClickHouse"], headcount: 1, client: "스마트팩토리코리아" },
  { title: "교육 플랫폼 모바일 앱 (Android)", type: "mobile", work: "remote", loc: null, status: "completed", stack: ["Kotlin", "Jetpack Compose", "Retrofit"], headcount: 2, client: "에듀클래스" },
  { title: "클라우드 인프라 구축 및 마이그레이션", type: "backend", work: "hybrid", loc: "서울 영등포구", status: "in_progress", stack: ["AWS", "Terraform", "Docker", "Kubernetes"], headcount: 2, client: "클라우드파트너" },
  { title: "의료 정보 시스템 고도화", type: "backend", work: "onsite", loc: "서울 종로구", status: "recruiting", stack: ["Java", "Spring", "Oracle", "HL7"], headcount: 3, client: "메디컬IT" },
  { title: "부동산 중개 앱 iOS 개발", type: "mobile", work: "remote", loc: null, status: "recruiting", stack: ["Swift", "SwiftUI", "Combine"], headcount: 1, client: "집다이렉트" },
  { title: "소셜 커머스 추천 엔진 개발", type: "data", work: "remote", loc: null, status: "cancelled", stack: ["Python", "PyTorch", "Elasticsearch"], headcount: 2, client: "소셜마켓" },
  { title: "공공기관 민원 포털 구축", type: "web", work: "onsite", loc: "대전", status: "in_progress", stack: ["Vue.js", "Spring Boot", "PostgreSQL"], headcount: 4, client: "정부24운영단" },
  { title: "게임 서버 백엔드 개발", type: "backend", work: "remote", loc: null, status: "recruiting", stack: ["Go", "Redis", "gRPC", "WebSocket"], headcount: 2, client: "게임스튜디오" },
  { title: "글로벌 이커머스 프론트엔드 개발", type: "web", work: "remote", loc: null, status: "recruiting", stack: ["Next.js", "TypeScript", "TailwindCSS"], headcount: 2, client: "글로벌샵" },
  { title: "보험 계약 관리 시스템 리팩토링", type: "fullstack", work: "onsite", loc: "서울 여의도", status: "in_progress", stack: ["React", "Java", "Spring", "Oracle"], headcount: 3, client: "하나보험IT" },
  { title: "식품 배달 앱 풀스택 개발", type: "fullstack", work: "hybrid", loc: "서울 성동구", status: "completed", stack: ["React Native", "Node.js", "MongoDB"], headcount: 3, client: "배달파트너" },
  { title: "실시간 영상 분석 AI 시스템", type: "data", work: "hybrid", loc: "경기 성남시", status: "recruiting", stack: ["Python", "OpenCV", "TensorFlow", "FastAPI"], headcount: 2, client: "비전AI" },
  { title: "3D 가상 전시관 웹 개발", type: "web", work: "remote", loc: null, status: "recruiting", stack: ["React", "Three.js", "WebGL", "TypeScript"], headcount: 1, client: "메타갤러리" },
  { title: "다국어 콘텐츠 관리 시스템", type: "fullstack", work: "remote", loc: null, status: "in_progress", stack: ["Nuxt.js", "Strapi", "PostgreSQL"], headcount: 2, client: "글로벌콘텐츠" },
  { title: "물류 배송 최적화 알고리즘 개발", type: "data", work: "hybrid", loc: "서울 강서구", status: "recruiting", stack: ["Python", "OR-Tools", "FastAPI"], headcount: 1, client: "로지스틱스AI" },
  { title: "헬스&피트니스 앱 백엔드 API", type: "backend", work: "remote", loc: null, status: "completed", stack: ["Kotlin", "Spring Webflux", "Redis", "MySQL"], headcount: 2, client: "핏라이프" },
  { title: "스타트업 MVP 프론트엔드 개발", type: "web", work: "remote", loc: null, status: "recruiting", stack: ["React", "Vite", "TailwindCSS", "Supabase"], headcount: 1, client: "스타트업X" },
  { title: "보안 취약점 점검 자동화 툴 개발", type: "other", work: "remote", loc: null, status: "in_progress", stack: ["Python", "Bash", "Ansible"], headcount: 1, client: "시큐리티파트너" },
  { title: "반응형 랜딩페이지 디자인 & 개발", type: "design", work: "remote", loc: null, status: "completed", stack: ["Figma", "HTML", "CSS", "JavaScript"], headcount: 1, client: "브랜드크리에이터" },
  { title: "교육 콘텐츠 스트리밍 플랫폼", type: "fullstack", work: "hybrid", loc: "서울 강남구", status: "recruiting", stack: ["Next.js", "Django", "AWS S3", "CloudFront"], headcount: 3, client: "에듀스트림" },
  { title: "스마트시티 데이터 시각화 대시보드", type: "web", work: "onsite", loc: "부산", status: "recruiting", stack: ["React", "D3.js", "TypeScript", "Grafana"], headcount: 2, client: "스마트시티부산" },
];

const NOTICES = [
  { title: "[필독] 2025년 1분기 플랫폼 정책 업데이트 안내", important: true, published: true, type: "immediate" },
  { title: "프로필 등록 시 유의사항 안내", important: false, published: true, type: "immediate" },
  { title: "[시스템 점검] 1월 15일(수) 새벽 2시~4시 서비스 중단", important: true, published: true, type: "immediate" },
  { title: "알림톡 수신 설정 변경 방법 안내", important: false, published: true, type: "immediate" },
  { title: "신규 프로젝트 매칭 기능 출시 안내", important: false, published: true, type: "immediate" },
  { title: "[공지] 수수료 정책 변경 사전 안내 (2025.03.01 적용)", important: true, published: true, type: "immediate" },
  { title: "이력서 파일 첨부 기능 추가 안내", important: false, published: true, type: "immediate" },
  { title: "카카오 알림톡 발송 서비스 개선 안내", important: false, published: false, type: "immediate" },
  { title: "[이벤트] 추천인 프로그램 시작 안내", important: false, published: true, type: "immediate" },
  { title: "개인정보 처리방침 개정 공지 (2025년 2월)", important: true, published: true, type: "immediate" },
  { title: "프리랜서 등급제 도입 안내", important: false, published: true, type: "immediate" },
  { title: "[보안 강화] 2단계 인증 설정 권고", important: true, published: true, type: "immediate" },
  { title: "신규 기술 스택 태그 추가 안내", important: false, published: true, type: "immediate" },
  { title: "3월 신규 프로젝트 대거 공개 예정 안내", important: false, published: true, type: "scheduled", start: "2025-03-01T00:00:00+09:00", end: "2025-03-31T23:59:59+09:00" },
  { title: "[긴급] 결제 시스템 장애 복구 완료 안내", important: true, published: true, type: "immediate" },
  { title: "서비스 이용약관 개정 안내 (v2.5)", important: false, published: true, type: "immediate" },
  { title: "설 연휴 고객센터 운영시간 변경 안내", important: false, published: false, type: "scheduled", start: "2025-01-25T00:00:00+09:00", end: "2025-02-02T23:59:59+09:00" },
  { title: "프로젝트 지원 현황 조회 기능 업데이트", important: false, published: true, type: "immediate" },
  { title: "기술 인터뷰 지원 서비스 출시 예정 안내", important: false, published: true, type: "immediate" },
  { title: "[필독] 허위 정보 등록 관련 제재 기준 강화 안내", important: true, published: true, type: "immediate" },
  { title: "앱 업데이트 v3.0 변경사항 안내", important: false, published: true, type: "immediate" },
  { title: "5월 특별 프로젝트 공개 예정 (선착순 지원)", important: false, published: true, type: "scheduled", start: "2025-05-01T09:00:00+09:00", end: "2025-05-31T23:59:59+09:00" },
  { title: "프로필 완성도 점수 시스템 도입 안내", important: false, published: true, type: "immediate" },
  { title: "[이벤트] 2025 상반기 프리랜서 설문조사 참여 혜택", important: false, published: false, type: "immediate" },
  { title: "API 연동 가이드 문서 업데이트 안내", important: false, published: true, type: "immediate" },
  { title: "데이터 백업 정책 변경 안내", important: false, published: true, type: "immediate" },
  { title: "[긴급 점검] 6월 1일 새벽 시스템 패치 안내", important: true, published: true, type: "immediate" },
  { title: "신규 파트너사 입점 안내 - 대기업 프로젝트 확대", important: false, published: true, type: "immediate" },
  { title: "스킬 인벤토리 자동 분석 기능 베타 출시", important: false, published: true, type: "immediate" },
  { title: "[하반기 예고] 팀 매칭 기능 출시 일정 안내", important: false, published: true, type: "scheduled", start: "2025-07-01T00:00:00+09:00", end: "2025-07-31T23:59:59+09:00" },
];

// ──────────────────────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────────────────────

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString()
    .split("T")[0];
}

function randomFutureDate(daysMin, daysMax) {
  const d = new Date();
  d.setDate(d.getDate() + daysMin + Math.floor(Math.random() * (daysMax - daysMin)));
  return d.toISOString().split("T")[0];
}

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ──────────────────────────────────────────────────────────────
// 1. 사용자 (auth.users + profiles)
// ──────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log("\n[1/3] 사용자 30건 삽입 중...");

  const profilesData = [];
  let created = 0;
  let skipped = 0;

  for (const u of USERS) {
    // Auth 유저 생성 (이미 있으면 조회)
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);

    let authId;
    if (found) {
      authId = found.id;
      skipped++;
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: "techmeet2025!",
        email_confirm: true,
      });
      if (error) {
        console.warn(`  [WARN] ${u.email} auth 생성 실패: ${error.message}`);
        continue;
      }
      authId = data.user.id;
      created++;
    }

    profilesData.push({
      id: authId,
      name: u.name,
      email: u.email,
      phone: `010-${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      bio: `${u.years}년 ${u.months}개월 경력의 ${u.tech[0]} 개발자입니다. 다양한 프로젝트 경험을 보유하고 있습니다.`,
      tech_stack: u.tech,
      experience_years: u.years,
      experience_months: u.months,
      availability_status: u.avail,
      available_from_date: u.avail === "available" ? randomFutureDate(0, 30) : null,
      notification_new_project: true,
      notification_application_update: true,
      notification_marketing: Math.random() > 0.5,
      account_status: "active",
      gender: u.gender,
      birth_date: randomDate(new Date("1985-01-01"), new Date("2000-12-31")),
      joining_date: randomDate(new Date("2023-01-01"), new Date("2025-06-01")),
    });
  }

  // profiles upsert (RLS bypass via service_role)
  if (profilesData.length > 0) {
    const { error } = await admin.from("profiles").upsert(profilesData, { onConflict: "id" });
    if (error) {
      console.error("  [ERROR] profiles 삽입 실패:", error.message);
    } else {
      console.log(`  ✓ auth 생성: ${created}건, 기존 재사용: ${skipped}건, profiles upsert: ${profilesData.length}건`);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 2. 추천인 관계 설정
// ──────────────────────────────────────────────────────────────

// [추천인 이메일, 피추천인 이메일]
const REFERRALS = [
  // 김민준(React 5yr) → 배소영, 공현석 (React 계열 후배)
  ["minjun.kim@techmeet.dev", "soyoung.bae@techmeet.dev"],
  ["minjun.kim@techmeet.dev", "hyunseok.kong@techmeet.dev"],
  // 임태양(DevOps 8yr) → 오준혁, 표재훈 (인프라/DevOps 계열)
  ["taeyang.im@techmeet.dev", "junhyuk.oh@techmeet.dev"],
  ["taeyang.im@techmeet.dev", "jaehoon.pyo@techmeet.dev"],
  // 박도현(Java 7yr) → 권성민, 홍민성 (JVM 계열)
  ["dohyun.park@techmeet.dev", "sungmin.kwon@techmeet.dev"],
  ["dohyun.park@techmeet.dev", "minsung.hong@techmeet.dev"],
  // 나유진(Python ML 5yr) → 안지현, 장민호 (데이터 계열)
  ["yujin.na@techmeet.dev", "jihyun.ahn@techmeet.dev"],
  ["yujin.na@techmeet.dev", "minho.jang@techmeet.dev"],
  // 강하은(iOS 6yr) → 민서아 (iOS 계열)
  ["haeun.kang@techmeet.dev", "seoa.min@techmeet.dev"],
  // 성준영(Scala 9yr) → 류태민 (시스템 프로그래밍)
  ["junyoung.sung@techmeet.dev", "taemin.ryu@techmeet.dev"],
  // 이서연(Vue 3yr) → 노은지, 채수빈 (프론트엔드 계열)
  ["seoyeon.lee@techmeet.dev", "eunji.no@techmeet.dev"],
  ["seoyeon.lee@techmeet.dev", "subin.chae@techmeet.dev"],
];

async function seedReferrers() {
  console.log("\n[2/4] 추천인 관계 12건 설정 중...");

  const emails = USERS.map((u) => u.email);
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", emails);

  if (error || !profiles?.length) {
    console.error("  [ERROR] profiles 조회 실패:", error?.message ?? "데이터 없음");
    return;
  }

  const idByEmail = Object.fromEntries(profiles.map((p) => [p.email, p.id]));

  let updated = 0;
  let skipped = 0;

  for (const [referrerEmail, referredEmail] of REFERRALS) {
    const referrerId = idByEmail[referrerEmail];
    const referredId = idByEmail[referredEmail];

    if (!referrerId || !referredId) {
      console.warn(`  [WARN] 매핑 실패: ${referrerEmail} → ${referredEmail}`);
      skipped++;
      continue;
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({ referrer_id: referrerId })
      .eq("id", referredId);

    if (updateError) {
      console.warn(`  [WARN] 업데이트 실패 (${referredEmail}): ${updateError.message}`);
      skipped++;
    } else {
      updated++;
    }
  }

  const referrerCount = new Set(REFERRALS.map((r) => r[0])).size;
  console.log(`  ✓ 추천 관계 ${updated}건 설정 완료 (실패: ${skipped}건)`);
  console.log(`  - 추천인 ${referrerCount}명 / 피추천인 ${updated}명`);
}

// ──────────────────────────────────────────────────────────────
// 3. 프로젝트 30건
// ──────────────────────────────────────────────────────────────

async function seedProjects() {
  console.log("\n[3/4] 프로젝트 30건 삽입 중...");

  const rows = PROJECTS.map((p, i) => {
    const startDate = randomDate(new Date("2025-01-01"), new Date("2025-12-01"));
    const endDateObj = new Date(startDate);
    endDateObj.setMonth(endDateObj.getMonth() + 2 + Math.floor(Math.random() * 4));
    const endDate = endDateObj.toISOString().split("T")[0];
    const deadline = randomDate(new Date("2025-06-01"), new Date("2025-09-30"));

    return {
      title: p.title,
      description: `${p.client}에서 진행하는 ${p.title} 프로젝트입니다.\n\n• 근무 형태: ${p.work === "remote" ? "원격" : p.work === "onsite" ? "상주" : "혼합"}\n${p.loc ? `• 근무지: ${p.loc}\n` : ""}• 모집 인원: ${p.headcount}명\n\n주요 기술 스택을 보유한 분의 지원을 기다립니다.`,
      status: p.status,
      duration_start_date: startDate,
      duration_end_date: endDate,
      deadline: p.status === "completed" || p.status === "cancelled" ? null : deadline,
      tech_stack: p.stack,
      requirements: ["관련 경력 2년 이상", "원활한 커뮤니케이션 능력", "팀 협업 경험"],
      category: p.type,
      client_name: p.client,
      project_type: p.type,
      work_type: p.work,
      location: p.loc,
      headcount: p.headcount,
      is_visible: p.status !== "cancelled",
    };
  });

  // 기존 샘플 데이터 확인 후 삽입
  const { count } = await admin.from("projects").select("id", { count: "exact", head: true });
  if (count > 0) {
    console.log(`  기존 프로젝트 ${count}건 존재 — 추가 삽입합니다.`);
  }

  const { error } = await admin.from("projects").insert(rows);
  if (error) {
    console.error("  [ERROR] projects 삽입 실패:", error.message);
  } else {
    console.log(`  ✓ projects ${rows.length}건 삽입 완료`);
  }
}

// ──────────────────────────────────────────────────────────────
// 4. 공지사항 30건
// ──────────────────────────────────────────────────────────────

async function seedNotices() {
  console.log("\n[4/4] 공지사항 30건 삽입 중...");

  const rows = NOTICES.map((n) => ({
    title: n.title,
    content: `${n.title}\n\n안녕하세요, TechMeet 운영팀입니다.\n\n${n.title}에 대해 안내드립니다.\n\n자세한 내용은 고객센터(support@techmeet.co.kr) 또는 앱 내 문의하기를 통해 문의해 주세요.\n\n감사합니다.`,
    is_published: n.published,
    is_important: n.important,
    notice_type: n.type,
    start_at: n.start ?? null,
    end_at: n.end ?? null,
    attachments: [],
  }));

  const { error } = await admin.from("notices").insert(rows);
  if (error) {
    console.error("  [ERROR] notices 삽입 실패:", error.message);
  } else {
    console.log(`  ✓ notices ${rows.length}건 삽입 완료`);
  }
}

// ──────────────────────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("========================================");
  console.log("  TechMeet 샘플 데이터 시드 스크립트");
  console.log("========================================");
  console.log(`  Supabase: ${SUPABASE_URL}`);

  await seedUsers();
  await seedReferrers();
  await seedProjects();
  await seedNotices();

  console.log("\n========================================");
  console.log("  샘플 데이터 삽입 완료!");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("\n[치명적 오류]", err.message);
  process.exit(1);
});
