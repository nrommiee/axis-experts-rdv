import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { listOrdersInDactyloStatus } from "@/lib/odoo/dactylo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (isAdmin(user.email)) {
      return NextResponse.json(
        { error: "Admin cannot access dactylo endpoints" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data: clientRow } = await admin
      .from("portal_clients")
      .select("client_type")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "No portal client row" },
        { status: 403 }
      );
    }

    if (clientRow.client_type !== "dactylo") {
      return NextResponse.json(
        { error: "Not a dactylo user" },
        { status: 403 }
      );
    }

    const orders = await listOrdersInDactyloStatus();
    return NextResponse.json({ orders, count: orders.length });
  } catch (err) {
    console.error("[dactylo/orders] error:", err);
    return NextResponse.json({ error: "Erreur Odoo" }, { status: 500 });
  }
}
