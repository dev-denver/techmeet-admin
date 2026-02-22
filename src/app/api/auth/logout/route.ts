import { createServerSupabaseClient } from "@/lib/supabase/server";
import { apiSuccess } from "@/lib/api/response";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return apiSuccess({ loggedOut: true });
}
