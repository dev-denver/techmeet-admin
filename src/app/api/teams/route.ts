import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/api/verify-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await verifyAdmin();
  if (error) return error;

  const adminClient = createAdminClient();
  const { data, error: dbError } = await adminClient
    .from("teams")
    .select(`
      *,
      members:profile_teams(
        id, role, joined_at,
        profile:profiles(id, name, email)
      )
    `)
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
    .from("teams")
    .insert(body)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ message: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
