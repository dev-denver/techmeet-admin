/**
 * 지원서 샘플 데이터 시드
 * 실행: node --env-file=.env.local scripts/seed-applications.mjs
 *
 * 프로젝트 상태별 지원 현황:
 *   recruiting  → pending / reviewing 위주 (3~5명)
 *   in_progress → accepted 1명 + 나머지 rejected/interview (3~5명)
 *   completed   → accepted 1~2명 + 나머지 rejected (3~6명)
 *   cancelled   → withdrawn / rejected (2~4명)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("[오류] 환경변수가 필요합니다.");
  console.error("  실행 방법: node --env-file=.env.local scripts/seed-applications.mjs");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────────────────────

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - rand(1, daysAgo));
  d.setHours(rand(8, 22), rand(0, 59), 0, 0);
  return d.toISOString();
}

function randomFutureDate(daysMin, daysMax) {
  const d = new Date();
  d.setDate(d.getDate() + rand(daysMin, daysMax));
  return d.toISOString().split("T")[0];
}

// ──────────────────────────────────────────────────────────────
// 커버레터 템플릿
// ──────────────────────────────────────────────────────────────

function makeCoverLetter(freelancerName, projectTitle, techStack) {
  const tech = techStack?.slice(0, 2).join(", ") ?? "관련 기술";
  const templates = [
    `안녕하세요, ${freelancerName}입니다.\n\n${projectTitle} 프로젝트에 지원합니다. ${tech} 분야에서 다수의 프로젝트를 경험했으며, 즉시 투입 가능한 상태입니다.\n\n팀과 원활히 협업하며 프로젝트 목표 달성에 기여하겠습니다. 검토 부탁드립니다.`,
    `${projectTitle} 포지션에 지원하게 된 ${freelancerName}입니다.\n\n${tech} 실무 경험을 바탕으로 빠르게 온보딩하여 성과를 낼 수 있습니다. 이전 프로젝트에서 유사한 환경의 개발 경험이 있어 적합한 후보라고 생각합니다.\n\n좋은 기회 주시면 최선을 다하겠습니다.`,
    `안녕하세요. ${tech} 전문 프리랜서 ${freelancerName}입니다.\n\n${projectTitle} 프로젝트 공고를 보고 지원합니다. 해당 기술 스택에 대한 깊은 이해와 실전 경험을 보유하고 있습니다.\n\n일정과 품질 모두 만족시킬 수 있도록 최선을 다하겠습니다. 감사합니다.`,
  ];
  return templates[rand(0, templates.length - 1)];
}

// ──────────────────────────────────────────────────────────────
// 프로젝트 상태별 지원 상태 배분 로직
// ──────────────────────────────────────────────────────────────

function assignStatuses(projectStatus, applicantCount) {
  const statuses = [];

  if (projectStatus === "recruiting") {
    // 대부분 pending, 일부 reviewing
    for (let i = 0; i < applicantCount; i++) {
      statuses.push(Math.random() < 0.6 ? "pending" : "reviewing");
    }
  } else if (projectStatus === "in_progress") {
    // accepted 1명, 나머지 rejected / interview
    statuses.push("accepted");
    for (let i = 1; i < applicantCount; i++) {
      const r = Math.random();
      statuses.push(r < 0.2 ? "interview" : "rejected");
    }
    statuses.sort(() => Math.random() - 0.5);
  } else if (projectStatus === "completed") {
    // accepted 1~2명, 나머지 rejected
    const acceptedCount = applicantCount >= 4 ? rand(1, 2) : 1;
    for (let i = 0; i < acceptedCount; i++) statuses.push("accepted");
    for (let i = acceptedCount; i < applicantCount; i++) statuses.push("rejected");
    statuses.sort(() => Math.random() - 0.5);
  } else if (projectStatus === "cancelled") {
    // withdrawn 또는 rejected
    for (let i = 0; i < applicantCount; i++) {
      statuses.push(Math.random() < 0.5 ? "withdrawn" : "rejected");
    }
  } else {
    for (let i = 0; i < applicantCount; i++) statuses.push("pending");
  }

  return statuses;
}

// ──────────────────────────────────────────────────────────────
// 메인 시드 로직
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log("========================================");
  console.log("  지원서 샘플 데이터 시드 스크립트");
  console.log("========================================");
  console.log(`  Supabase: ${SUPABASE_URL}\n`);

  // 1) 기존 데이터 확인
  const { count: existing } = await admin
    .from("applications")
    .select("id", { count: "exact", head: true });

  if (existing > 0) {
    console.log(`  기존 applications ${existing}건 존재 — 중복 무시(upsert 불가) 후 추가합니다.`);
  }

  // 2) 프로젝트 전체 조회
  const { data: projects } = await admin
    .from("projects")
    .select("id, title, status, tech_stack")
    .order("created_at", { ascending: true });

  // 3) 활성 프로필 전체 조회
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, account_status")
    .eq("account_status", "active");

  console.log(`  프로젝트: ${projects.length}건 / 활성 프리랜서: ${profiles.length}명\n`);

  // 4) 프로젝트별 지원서 생성
  const rows = [];
  const seen = new Set(); // (project_id, freelancer_id) 중복 방지

  for (const project of projects) {
    const applicantCount = project.status === "cancelled" ? rand(2, 4) : rand(3, 6);
    const applicants = pick(profiles, applicantCount);
    const statuses = assignStatuses(project.status, applicants.length);

    applicants.forEach((freelancer, idx) => {
      const key = `${project.id}__${freelancer.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const status = statuses[idx];
      rows.push({
        project_id: project.id,
        freelancer_id: freelancer.id,
        status,
        cover_letter: makeCoverLetter(
          freelancer.name,
          project.title,
          project.tech_stack
        ),
        expected_rate: rand(50, 120) * 10000, // 50만~120만원
        available_start_date:
          status === "accepted" || status === "interview"
            ? randomFutureDate(7, 30)
            : randomFutureDate(14, 60),
        admin_memo:
          status === "rejected"
            ? pick(["기술 스택 미달", "경력 부족", "일정 불일치", "타 지원자 채용"], 1)[0]
            : status === "accepted"
            ? "최종 합격 — 계약 진행"
            : null,
        applied_at: randomPastDate(90),
      });
    });
  }

  console.log(`  생성할 지원서: ${rows.length}건`);

  // 5) 삽입 (중복 키 오류 시 개별 건너뜀)
  const CHUNK = 50;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("applications").insert(chunk);
    if (error) {
      // 중복 등 오류 시 건별 재시도
      for (const row of chunk) {
        const { error: e2 } = await admin.from("applications").insert(row);
        if (e2) skipped++;
        else inserted++;
      }
    } else {
      inserted += chunk.length;
    }
  }

  // 6) 상태별 통계
  const { data: stats } = await admin
    .from("applications")
    .select("status");

  const statusCount = {};
  for (const { status } of stats ?? []) {
    statusCount[status] = (statusCount[status] ?? 0) + 1;
  }

  console.log(`\n  ✓ 삽입: ${inserted}건 / 건너뜀: ${skipped}건`);
  console.log("\n  상태별 현황:");
  for (const [s, c] of Object.entries(statusCount).sort()) {
    console.log(`    ${s.padEnd(10)} ${c}건`);
  }
  console.log("\n========================================");
  console.log("  완료!");
  console.log("========================================\n");
}

main().catch((err) => {
  console.error("\n[치명적 오류]", err.message);
  process.exit(1);
});
