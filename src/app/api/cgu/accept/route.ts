import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/audit/log-action";

export const dynamic = "force-dynamic";

const CURRENT_CGU_VERSION = "v1.0";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    const admin = createAdminClient();
    const { error: insertError } = await admin.from("user_consents").insert({
      user_id: user.id,
      cgu_version: CURRENT_CGU_VERSION,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, alreadyAccepted: true });
      }
      console.error("[cgu.accept] insert failed", insertError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement" },
        { status: 500 }
      );
    }

    await logAction({
      userId: user.id,
      action: "cgu.accept",
      metadata: { version: CURRENT_CGU_VERSION },
    });

    return NextResponse.json({ ok: true, version: CURRENT_CGU_VERSION });
  } catch (err) {
    console.error("[cgu.accept] unexpected error", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
