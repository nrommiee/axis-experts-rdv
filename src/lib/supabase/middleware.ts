import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin";

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

  // Admin users land on /admin, never on the client portal. Intercept the
  // entry points (/, /login, /dashboard) explicitly; /admin/* and everything
  // else (API, /account-suspended, /setup-account, /reset-password) pass through.
  if (user && isAdmin(user.email)) {
    const path = request.nextUrl.pathname;
    if (
      path === "/" ||
      path === "/login" ||
      path === "/dashboard" ||
      path.startsWith("/dashboard/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Admin users land on /admin, never on the dactylo portal either.
  // Extend the admin intercept to cover /dactylo so that an admin typing
  // /dactylo is sent back to /admin, consistent with /dashboard behavior.
  if (user && isAdmin(user.email)) {
    const path = request.nextUrl.pathname;
    if (path === "/dactylo" || path.startsWith("/dactylo/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // For authenticated non-admin users, fetch portal_clients once and reuse
  // for both (a) organization-active check and (b) dactylo client_type
  // routing. Run on all app paths except /admin, /setup-account, and API
  // routes. "/" and "/login" are included so a dactylo user landing there
  // is routed to /dactylo.
  if (
    user &&
    !isAdmin(user.email) &&
    !request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/setup-account") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client } = await adminDb
      .from("portal_clients")
      .select("organization_id, client_type")
      .eq("user_id", user.id)
      .single();

    // (a) Organization suspension check
    if (client?.organization_id) {
      const { data: org } = await adminDb
        .from("organizations")
        .select("is_active")
        .eq("id", client.organization_id)
        .single();

      if (
        org &&
        !org.is_active &&
        !request.nextUrl.pathname.startsWith("/account-suspended")
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/account-suspended";
        return NextResponse.redirect(url);
      }
    }

    // (b) Dactylo routing.
    // If portal_clients row is missing (auth user whose setup-account never
    // completed), client is null and we skip this branch — default pass-through.
    if (client?.client_type) {
      const path = request.nextUrl.pathname;
      const isDactyloPath =
        path === "/dactylo" || path.startsWith("/dactylo/");
      const isStandardPortalPath =
        path === "/" ||
        path === "/login" ||
        path === "/dashboard" ||
        path.startsWith("/dashboard/") ||
        path === "/demande" ||
        path.startsWith("/demande/") ||
        path === "/brouillons" ||
        path.startsWith("/brouillons/") ||
        path === "/profil" ||
        path.startsWith("/profil/") ||
        path === "/confirmation" ||
        path.startsWith("/confirmation/");

      if (client.client_type === "dactylo" && isStandardPortalPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/dactylo";
        return NextResponse.redirect(url);
      }

      if (client.client_type !== "dactylo" && isDactyloPath) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Suspension check for API routes (preserves previous 403 JSON behavior
  // since the main fetch block above excludes /api/).
  if (
    user &&
    !isAdmin(user.email) &&
    request.nextUrl.pathname.startsWith("/api/")
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
        return NextResponse.json(
          { error: "Organisation suspendue" },
          { status: 403 }
        );
      }
    }
  }

  return supabaseResponse;
}
