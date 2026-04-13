import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from("invitations")
      .select("id, email, organization_id, client_type, expires_at, used_at, organizations(name)")
      .eq("token", token)
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json(
        { error: "Token invalide" },
        { status: 400 }
      );
    }

    if (invitation.used_at) {
      return NextResponse.json(
        { error: "Cette invitation a deja ete utilisee" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Cette invitation a expire" },
        { status: 400 }
      );
    }

    const orgName =
      invitation.organizations &&
      typeof invitation.organizations === "object" &&
      !Array.isArray(invitation.organizations)
        ? (invitation.organizations as { name: string }).name
        : "";

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      organization_name: orgName,
    });
  } catch (err) {
    console.error("GET /api/auth/validate-token error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
