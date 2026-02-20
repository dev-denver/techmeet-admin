import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const body = await request.json();
  const {
    template_code,
    template_name,
    service_type,
    send_type,
    scheduled_at,
    target,
    user_id,
  } = body;

  const adminClient = createAdminClient();

  // 카카오 알림톡 API 호출 (추후 구현)
  // 현재는 로그만 저장
  if (target === "individual" && user_id) {
    const { error: dbError } = await adminClient.from("alimtalk_logs").insert({
      user_id,
      template_code,
      template_name,
      service_type,
      send_type,
      scheduled_at: scheduled_at ?? null,
      is_success: null, // 실제 발송 후 업데이트
    });

    if (dbError) {
      return NextResponse.json({ message: dbError.message }, { status: 500 });
    }
  } else {
    // 전체 발송 - 사용자 목록 조회
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("account_status", "active");

    if (profiles && profiles.length > 0) {
      const logs = profiles.map((p) => ({
        user_id: p.id,
        template_code,
        template_name,
        service_type,
        send_type,
        scheduled_at: scheduled_at ?? null,
        is_success: null,
      }));

      const { error: dbError } = await adminClient
        .from("alimtalk_logs")
        .insert(logs);

      if (dbError) {
        return NextResponse.json({ message: dbError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
