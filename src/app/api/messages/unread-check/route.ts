import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooExecute } from "@/lib/odoo";

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

    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("odoo_partner_id")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "Client non configuré" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: reads } = await admin
      .from("portal_message_reads")
      .select("odoo_order_id, last_read_at")
      .eq("user_id", user.id);

    if (!Array.isArray(reads) || reads.length === 0) {
      return NextResponse.json({});
    }

    const lastReadByOrder = new Map<number, string>();
    for (const r of reads as { odoo_order_id: number; last_read_at: string }[]) {
      lastReadByOrder.set(r.odoo_order_id, r.last_read_at);
    }

    const orderIds = Array.from(lastReadByOrder.keys());

    const recentMessages = (await odooExecute(
      "mail.message",
      "search_read",
      [[
        ["model", "=", "sale.order"],
        ["res_id", "in", orderIds],
        ["message_type", "in", ["comment", "email"]],
      ]],
      {
        fields: ["res_id", "date"],
        order: "date desc",
        limit: 100,
      }
    )) as { res_id: number; date: string }[];

    const lastMessageByOrder = new Map<number, string>();
    for (const m of recentMessages) {
      if (!lastMessageByOrder.has(m.res_id)) {
        lastMessageByOrder.set(m.res_id, m.date);
      }
    }

    const unread: Record<number, boolean> = {};
    for (const orderId of orderIds) {
      const lastMsg = lastMessageByOrder.get(orderId);
      if (!lastMsg) {
        unread[orderId] = false;
        continue;
      }
      const lastRead = lastReadByOrder.get(orderId);
      unread[orderId] = !lastRead || lastMsg > lastRead;
    }

    return NextResponse.json({ unread });
  } catch (err) {
    console.error("messages/unread-check GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
