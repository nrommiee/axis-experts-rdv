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
    .select("odoo_partner_id, odoo_contact_partner_id, nom_societe, nom_bailleur, display_name")
    .eq("user_id", user.id)
    .single();

  if (!clientRow) return null;

  const partnerId =
    typeof clientRow.odoo_partner_id === "number"
      ? clientRow.odoo_partner_id
      : parseInt(String(clientRow.odoo_partner_id), 10);

  return {
    partnerId,
    contactPartnerId: clientRow.odoo_contact_partner_id || null,
    nomSociete: clientRow.nom_societe || null,
    nomBailleur: clientRow.nom_bailleur || null,
    displayName:
      typeof clientRow.display_name === "string" && clientRow.display_name.trim().length > 0
        ? clientRow.display_name.trim()
        : null,
    userEmail: user.email || null,
  };
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

    // Step 1: Read message_ids from the sale.order
    const orders = (await odooExecute(
      "sale.order",
      "search_read",
      [[["id", "=", orderId]]],
      { fields: ["message_ids"], limit: 1 }
    )) as { message_ids: number[] }[];

    const messageIds: number[] = orders[0]?.message_ids || [];
    if (messageIds.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Read the actual messages by their IDs
    const messages = (await odooExecute(
      "mail.message",
      "search_read",
      [[["id", "in", messageIds]]],
      {
        fields: ["id", "body", "author_id", "date", "subtype_id", "attachment_ids"],
        order: "date asc",
        limit: 50,
      }
    )) as {
      id: number;
      body: string;
      author_id: [number, string] | false;
      date: string;
      subtype_id: [number, string] | false;
      attachment_ids: number[];
    }[];

    console.log('[Messages GET] raw results:', JSON.stringify(messages?.slice(0, 2)));

    // Step 3: Filter out internal notes (Log note) client-side
    const filtered = messages.filter(
      (m) => !m.subtype_id || m.subtype_id[1] !== "Log note"
    );

    // Step 4: Collect all attachment ids and fetch their metadata in one call
    const allAttachmentIds = Array.from(
      new Set(
        filtered.flatMap((m) =>
          Array.isArray(m.attachment_ids) ? m.attachment_ids : []
        )
      )
    );

    const attachMap = new Map<
      number,
      { id: number; name: string; mimetype: string }
    >();
    if (allAttachmentIds.length > 0) {
      const attachRows = (await odooExecute(
        "ir.attachment",
        "search_read",
        [[["id", "in", allAttachmentIds]]],
        { fields: ["id", "name", "mimetype"], limit: 100 }
      )) as { id: number; name: string; mimetype: string }[];
      for (const a of attachRows) {
        attachMap.set(a.id, { id: a.id, name: a.name, mimetype: a.mimetype });
      }
    }

    const result = filtered.map((m) => {
      const authorIdNum = Array.isArray(m.author_id) ? m.author_id[0] : null;
      const authorNameRaw = Array.isArray(m.author_id) ? m.author_id[1] : "";
      const isFromClient = authorIdNum === client.partnerId;
      const attachments = Array.isArray(m.attachment_ids)
        ? m.attachment_ids
            .map((id) => attachMap.get(id))
            .filter(
              (a): a is { id: number; name: string; mimetype: string } =>
                Boolean(a)
            )
        : [];
      return {
        id: m.id,
        body: m.body || "",
        authorId: authorIdNum,
        authorName: isFromClient ? "Vous" : authorNameRaw,
        date: m.date,
        isFromClient,
        attachments,
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
    const { orderId, message, attachments } = body as {
      orderId?: number;
      message?: string;
      attachments?: Array<{ name?: unknown; mimetype?: unknown; data?: unknown }>;
    };

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

    // Validate attachments (optional, defaults to []).
    // Base64 of 10 Mo ≈ 13_981_014 characters (ceil(10*1024*1024 / 3) * 4).
    const MAX_ATTACHMENTS = 3;
    const MAX_ATTACHMENT_BASE64 = 13_981_014;
    const rawAttachments = Array.isArray(attachments) ? attachments : [];
    if (rawAttachments.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ATTACHMENTS} fichiers par message` },
        { status: 400 }
      );
    }
    const validAttachments: { name: string; mimetype: string; data: string }[] = [];
    for (const att of rawAttachments) {
      if (
        !att ||
        typeof att.name !== "string" ||
        typeof att.mimetype !== "string" ||
        typeof att.data !== "string"
      ) {
        return NextResponse.json(
          { error: "Pièce jointe invalide" },
          { status: 400 }
        );
      }
      if (att.data.length > MAX_ATTACHMENT_BASE64) {
        return NextResponse.json(
          { error: "Fichier trop volumineux (max 10 Mo)" },
          { status: 400 }
        );
      }
      validAttachments.push({
        name: att.name,
        mimetype: att.mimetype,
        data: att.data,
      });
    }

    if (!(await verifyOrderOwnership(orderId, client.partnerId))) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // Create ir.attachment records first, then pass their IDs to message_post
    // so they are linked to the mail.message in the chatter.
    const attachmentIds: number[] = [];
    for (const att of validAttachments) {
      try {
        const attId = (await odooExecute("ir.attachment", "create", [
          {
            name: att.name,
            mimetype: att.mimetype,
            datas: att.data,
            res_model: "sale.order",
            res_id: orderId,
            type: "binary",
          },
        ])) as number;
        attachmentIds.push(attId);
      } catch (e) {
        console.warn("[Messages POST] attachment create failed:", e);
      }
    }

    // Prefix the body with a human-readable identifier so the message is
    // clearly attributed to the user in Odoo's chatter. We cannot change
    // author_id (all users share the same company partner), so this label
    // is the minimum needed to differentiate who sent the message.
    const authorLabel = client.displayName || client.userEmail || null;
    const bodyForOdoo = authorLabel ? `[${authorLabel}] ${trimmed}` : trimmed;

    await odooExecute("sale.order", "message_post", [[orderId]], {
      body: bodyForOdoo,
      message_type: "comment",
      subtype_xmlid: "mail.mt_comment",
      author_id: client.partnerId,
      partner_ids: [client.partnerId],
      ...(attachmentIds.length > 0 && { attachment_ids: attachmentIds }),
    });

    // Manage subscribers: subscribe contact partner, unsubscribe company partner
    try {
      if (client.contactPartnerId) {
        // Utilise directement le partner existant, pas de search/create
        await odooExecute("sale.order", "message_subscribe", [[orderId]], {
          partner_ids: [client.contactPartnerId],
        });
        await odooExecute("sale.order", "message_unsubscribe", [[orderId]], {
          partner_ids: [client.partnerId],
        });
      } else if (client.userEmail) {
        // Fallback : comportement actuel par email
        const existing = (await odooExecute(
          "res.partner",
          "search_read",
          [[["email", "=", client.userEmail]]],
          { fields: ["id"], limit: 1 }
        )) as { id: number }[];

        let portalPartnerId: number;
        if (existing.length > 0) {
          portalPartnerId = existing[0].id;
        } else {
          const partnerName =
            client.nomSociete || client.nomBailleur || client.userEmail;
          portalPartnerId = (await odooExecute(
            "res.partner",
            "create",
            [{ name: partnerName, email: client.userEmail }]
          )) as number;
        }

        await odooExecute("sale.order", "message_subscribe", [[orderId]], {
          partner_ids: [portalPartnerId],
        });
        await odooExecute("sale.order", "message_unsubscribe", [[orderId]], {
          partner_ids: [client.partnerId],
        });
      }
    } catch (subErr) {
      console.warn("[Messages POST] subscriber management failed:", subErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("odoo/messages POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
