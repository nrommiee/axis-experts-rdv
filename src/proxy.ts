import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Skip Supabase middleware entirely for reset-password to preserve the
  // PKCE ?code= query param needed by exchangeCodeForSession() on the client.
  if (request.nextUrl.pathname.startsWith("/reset-password")) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
