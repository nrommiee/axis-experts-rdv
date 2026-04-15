import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );

  // Skip auth check for reset-password to preserve the PKCE code
  // for client-side exchangeCodeForSession()
  if (request.nextUrl.pathname.startsWith("/reset-password")) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/setup-account") &&
    !request.nextUrl.pathname.startsWith("/api/auth/validate-token") &&
    !request.nextUrl.pathname.startsWith("/api/auth/setup-account") &&
    request.nextUrl.pathname !== "/"
  ) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check if the authenticated user's organization is active.
  // Skip for public pages, admin pages, API routes, and the suspended page itself.
  if (
    user &&
    !request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/account-suspended") &&
    !request.nextUrl.pathname.startsWith("/setup-account") &&
    request.nextUrl.pathname !== "/"
  ) {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client } = await adminDb
      .from("portal_clients")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (client?.organization_id) {
      const { data: org } = await adminDb
        .from("organizations")
        .select("is_active")
        .eq("id", client.organization_id)
        .single();

      if (org && !org.is_active) {
        if (request.nextUrl.pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Organisation suspendue" },
            { status: 403 }
          );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/account-suspended";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
