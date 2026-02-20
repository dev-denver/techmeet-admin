import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("applications")
    .select(`
      *,
      project:projects(id, title, status),
      profile:profiles(id, name, email, phone)
    `)
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ message: "지원서를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const { status, admin_memo } = await request.json();
  const adminClient = createAdminClient();

  const { data, error: dbError } = await adminClient
    .from("applications")
    .update({
      status,
      admin_memo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
