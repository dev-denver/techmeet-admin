import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_CACHE_TTL = 5 * 60; // 5분 (초)

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    const pathname = request.nextUrl.pathname;
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    const pathname = request.nextUrl.pathname;

    if (pathname === "/login") {
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return supabaseResponse;
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // admin_users DB 조회 결과를 쿠키에 단기 캐싱 (매 요청 DB 쿼리 방지)
    const cached = request.cookies.get("__admin_ok")?.value;
    let adminVerified = false;

    if (cached) {
      const [cachedUserId, cachedTs] = cached.split(":");
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(cachedTs, 10);
      if (cachedUserId === user.id && !isNaN(ts) && now - ts < ADMIN_CACHE_TTL) {
        adminVerified = true;
      }
    }

    if (!adminVerified) {
      const adminClient = createServerClient(supabaseUrl, supabaseServiceKey, {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      });

      const { data: adminUser } = await adminClient
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!adminUser) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }

      const now = Math.floor(Date.now() / 1000);
      supabaseResponse.cookies.set("__admin_ok", `${user.id}:${now}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ADMIN_CACHE_TTL,
        path: "/",
      });
    }

    return supabaseResponse;
  } catch (e) {
    console.error("[proxy] error:", e);
    const pathname = request.nextUrl.pathname;
    if (pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)" ],
};
