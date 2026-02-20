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
    .from("notices")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ message: "공지사항을 찾을 수 없습니다." }, { status: 404 });
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
  const body = await request.json();
  const adminClient = createAdminClient();

  const { data, error: dbError } = await adminClient
    .from("notices")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const { id } = await params;
  const adminClient = createAdminClient();
  const { error: dbError } = await adminClient
    .from("notices")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
