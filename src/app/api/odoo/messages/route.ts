import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooExecute } from "@/lib/odoo";

export const dynamic = "force-dynamic";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: clientRow } = await supabase
    .from("portal_clients")
    .select("odoo_partner_id")
    .eq("user_id", user.id)
    .single();

  if (!clientRow) return null;

  const partnerId =
    typeof clientRow.odoo_partner_id === "number"
      ? clientRow.odoo_partner_id
      : parseInt(String(clientRow.odoo_partner_id), 10);

  return { partnerId };
}

async function verifyOrderOwnership(orderId: number, partnerId: number): Promise<boolean> {
  const count = (await odooExecute(
    "sale.order",
    "search_count",
    [[["id", "=", orderId], ["partner_id", "=", partnerId]]]
  )) as number;
  return count > 0;
}

export async function GET(request: Request) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get("orderId");
    if (!orderIdParam) {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    }

    const orderId = parseInt(orderIdParam, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "orderId invalide" }, { status: 400 });
    }

    if (!(await verifyOrderOwnership(orderId, client.partnerId))) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const messages = (await odooExecute(
      "mail.message",
      "search_read",
      [
        [
          ["res_model", "=", "sale.order"],
          ["res_id", "=", orderId],
          ["subtype_id.internal", "=", false],
        ],
      ],
      {
        fields: ["id", "body", "author_id", "date", "message_type"],
        order: "date asc",
        limit: 50,
      }
    )) as {
      id: number;
      body: string;
      author_id: [number, string] | false;
      date: string;
      message_type: string;
    }[];

    console.log('[Messages GET] raw results:', JSON.stringify(messages?.slice(0, 2)));

    const result = messages.map((m) => {
      const authorIdNum = Array.isArray(m.author_id) ? m.author_id[0] : null;
      const authorNameRaw = Array.isArray(m.author_id) ? m.author_id[1] : "";
      const isFromClient = authorIdNum === client.partnerId;
      return {
        id: m.id,
        body: m.body || "",
        authorId: authorIdNum,
        authorName: isFromClient ? "Vous" : authorNameRaw,
        date: m.date,
        isFromClient,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("odoo/messages GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await getAuthenticatedClient();
    if (!client) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, message } = body as { orderId?: number; message?: string };

    if (!orderId || typeof orderId !== "number") {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message requis" }, { status: 400 });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return NextResponse.json({ error: "message vide" }, { status: 400 });
    }
    if (trimmed.length > 2000) {
      return NextResponse.json(
        { error: "Message trop long (max 2000 caractères)" },
        { status: 400 }
      );
    }

    if (!(await verifyOrderOwnership(orderId, client.partnerId))) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    await odooExecute("sale.order", "message_post", [[orderId]], {
      body: trimmed,
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
      author_id: client.partnerId,
      partner_ids: [client.partnerId],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("odoo/messages POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
