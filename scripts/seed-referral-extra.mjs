/**
 * 추천인 그룹 뷰 테스트용 추가 데이터 시드
 * 실행: node --env-file=.env.local scripts/seed-referral-extra.mjs
 *
 * 기존 시드(seed-sample-data.mjs)와 독립 실행 가능
 * - 신규 유저 10명 추가 (auth.users + profiles)
 * - 추천 관계 10건 추가 (기존 추천인 보강 + 신규 추천인 3명)
 *
 * 실행 후 추천 현황:
 *   김민준  4명 (기존 2 + 신규 2)
 *   나유진  4명 (기존 2 + 신규 2)
 *   박도현  3명 (기존 2 + 신규 1)
 *   임태양  3명 (기존 2 + 신규 1)
 *   이서연  2명 (기존 유지)
 *   조현우  2명 (신규 추천인)
 *   강하은  1명 (기존 유지)
 *   성준영  1명 (기존 유지)
 *   최지우  1명 (신규 추천인)
 *   정우진  1명 (신규 추천인)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[오류] NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  console.error("  실행 방법: node --env-file=.env.local scripts/seed-referral-extra.mjs");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────
// 신규 유저 10명
// ──────────────────────────────────────────────────────────────

const EXTRA_USERS = [
  { name: "김태호",  email: "taeho.kim@techmeet.dev",    tech: ["React", "TypeScript", "Zustand"],       years: 4, months: 2,  avail: "available",   gender: "male" },
  { name: "이민지",  email: "minji.lee@techmeet.dev",    tech: ["Python", "LangChain", "FastAPI"],       years: 3, months: 5,  avail: "available",   gender: "female" },
  { name: "박서준",  email: "seojun.park@techmeet.dev",  tech: ["Java", "Spring Boot", "JPA"],          years: 2, months: 9,  avail: "partial",     gender: "male" },
  { name: "최아름",  email: "areum.choi@techmeet.dev",   tech: ["Flutter", "Dart", "Riverpod"],         years: 3, months: 0,  avail: "available",   gender: "female" },
  { name: "정하늘",  email: "haneul.jung@techmeet.dev",  tech: ["Go", "gRPC", "Kubernetes"],            years: 6, months: 3,  avail: "available",   gender: "male" },
  { name: "강준혁",  email: "junhyuk.kang@techmeet.dev", tech: ["iOS", "Swift", "Combine"],             years: 5, months: 1,  avail: "partial",     gender: "male" },
  { name: "조은별",  email: "eunbyul.jo@techmeet.dev",   tech: ["Android", "Kotlin", "Hilt"],          years: 4, months: 7,  avail: "available",   gender: "female" },
  { name: "윤도영",  email: "doyoung.yun@techmeet.dev",  tech: ["Node.js", "NestJS", "Prisma"],         years: 5, months: 4,  avail: "unavailable", gender: "male" },
  { name: "임소연",  email: "soyeon.im@techmeet.dev",    tech: ["Vue.js", "Pinia", "TailwindCSS"],      years: 2, months: 11, avail: "available",   gender: "female" },
  { name: "한지원",  email: "jiwon.han@techmeet.dev",    tech: ["AWS", "Terraform", "CloudFormation"],  years: 7, months: 6,  avail: "available",   gender: "female" },
];

// ──────────────────────────────────────────────────────────────
// 추가 추천 관계 (기존 추천인 보강 + 신규 추천인)
// [추천인 이메일, 피추천인 이메일]
// ──────────────────────────────────────────────────────────────

const EXTRA_REFERRALS = [
  // 김민준(React) → 신규 React 계열 2명 (기존 2 → 총 4명)
  ["minjun.kim@techmeet.dev",   "taeho.kim@techmeet.dev"],
  ["minjun.kim@techmeet.dev",   "minji.lee@techmeet.dev"],

  // 나유진(Python ML) → 신규 데이터/ML 계열 2명 (기존 2 → 총 4명)
  ["yujin.na@techmeet.dev",     "areum.choi@techmeet.dev"],
  ["yujin.na@techmeet.dev",     "soyeon.im@techmeet.dev"],

  // 박도현(Java) → 신규 JVM 계열 1명 (기존 2 → 총 3명)
  ["dohyun.park@techmeet.dev",  "seojun.park@techmeet.dev"],

  // 임태양(DevOps) → 신규 인프라 계열 1명 (기존 2 → 총 3명)
  ["taeyang.im@techmeet.dev",   "jiwon.han@techmeet.dev"],

  // 조현우(Android) → 신규 Mobile 계열 2명 (신규 추천인)
  ["hyunwoo.jo@techmeet.dev",   "junhyuk.kang@techmeet.dev"],
  ["hyunwoo.jo@techmeet.dev",   "eunbyul.jo@techmeet.dev"],

  // 최지우(Python/Django) → 신규 백엔드 1명 (신규 추천인)
  ["jiwoo.choi@techmeet.dev",   "doyoung.yun@techmeet.dev"],

  // 정우진(Flutter) → 신규 Go 계열 1명 (신규 추천인)
  ["woojin.jung@techmeet.dev",  "haneul.jung@techmeet.dev"],
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

// ──────────────────────────────────────────────────────────────
// 1. 신규 유저 삽입
// ──────────────────────────────────────────────────────────────

async function seedExtraUsers() {
  console.log("\n[1/2] 신규 유저 10명 삽입 중...");

  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existingEmails = new Set((existing?.users ?? []).map((u) => u.email));

  const profilesData = [];
  let created = 0;
  let skipped = 0;

  for (const u of EXTRA_USERS) {
    let authId;

    if (existingEmails.has(u.email)) {
      const found = existing.users.find((x) => x.email === u.email);
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
      bio: `${u.years}년 ${u.months}개월 경력의 ${u.tech[0]} 개발자입니다.`,
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
      birth_date: randomDate(new Date("1988-01-01"), new Date("2001-12-31")),
      joining_date: randomDate(new Date("2024-01-01"), new Date("2025-06-01")),
    });
  }

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
// 2. 추천 관계 설정
// ──────────────────────────────────────────────────────────────

async function seedExtraReferrals() {
  console.log("\n[2/2] 추천 관계 10건 설정 중...");

  const allEmails = [
    ...EXTRA_USERS.map((u) => u.email),
    // 기존 추천인들도 조회 대상에 포함
    "minjun.kim@techmeet.dev",
    "yujin.na@techmeet.dev",
    "dohyun.park@techmeet.dev",
    "taeyang.im@techmeet.dev",
    "hyunwoo.jo@techmeet.dev",
    "jiwoo.choi@techmeet.dev",
    "woojin.jung@techmeet.dev",
  ];

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", allEmails);

  if (error || !profiles?.length) {
    console.error("  [ERROR] profiles 조회 실패:", error?.message ?? "데이터 없음");
    return;
  }

  const idByEmail = Object.fromEntries(profiles.map((p) => [p.email, p.id]));

  let updated = 0;
  let skipped = 0;

  for (const [referrerEmail, referredEmail] of EXTRA_REFERRALS) {
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

  console.log(`  ✓ 추천 관계 ${updated}건 설정 완료 (실패: ${skipped}건)`);
}

// ──────────────────────────────────────────────────────────────
// 실행
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("========================================");
  console.log("  추천인 그룹 뷰 추가 시드 스크립트");
  console.log("========================================");
  console.log(`  Supabase: ${SUPABASE_URL}`);

  await seedExtraUsers();
  await seedExtraReferrals();

  console.log("\n========================================");
  console.log("  완료! 추천 현황 (예상):");
  console.log("  김민준  4명 | 나유진  4명");
  console.log("  박도현  3명 | 임태양  3명");
  console.log("  이서연  2명 | 조현우  2명");
  console.log("  강하은  1명 | 성준영  1명");
  console.log("  최지우  1명 | 정우진  1명");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("\n[치명적 오류]", err.message);
  process.exit(1);
});
