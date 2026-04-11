import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orderId } = body as { orderId?: number };

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("portal_message_reads")
      .upsert(
        {
          user_id: user.id,
          odoo_order_id: orderId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,odoo_order_id" }
      );

    if (error) {
      console.error("messages/read upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("messages/read POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
