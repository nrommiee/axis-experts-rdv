import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Page publique de prise de RDV (sans login) — totalement isolée du portail
  // privé. On court-circuite le middleware Supabase (auth + gate CGU) pour ces
  // préfixes uniquement. Purement additif : aucun chemin privé ne matche ces
  // préfixes, donc le comportement des routes privées est inchangé.
  if (
    request.nextUrl.pathname.startsWith("/prendre-rdv") ||
    request.nextUrl.pathname.startsWith("/confirmer") ||
    request.nextUrl.pathname.startsWith("/api/public/")
  ) {
    return NextResponse.next();
  }

  // Skip Supabase middleware entirely for reset-password to preserve the
  // PKCE ?code= query param needed by exchangeCodeForSession() on the client.
  if (request.nextUrl.pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  // Skip Supabase middleware for /setup-account so the token query
  // param passes through and the page remains publicly accessible.
  if (request.nextUrl.pathname.startsWith("/setup-account")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
