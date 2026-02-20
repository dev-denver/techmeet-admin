import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await verifyAdmin();
  if (error) return error;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { error } = await verifyAdmin();
  if (error) return error;

  const body = await request.json();
  const adminClient = createAdminClient();

  const { data, error: dbError } = await adminClient
    .from("notices")
    .insert(body)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
