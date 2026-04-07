import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooCreate, odooExecute, odooSearch, getTemplateId } from "@/lib/odoo";
import { TYPE_BIEN_ODOO_MAP } from "@/lib/types";
import { Resend } from "resend";

// Vercel route segment config
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function ensureInt(val: unknown): number {
  if (typeof val === "number") return Math.floor(val);
  if (typeof val === "string") return parseInt(val, 10);
  return 0;
}

export async function POST(request: Request) {
  try {
    // ── Auth ──
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ── Parse body ──
    const data = await request.json();
    const {
      typeMission, typeBien, rue, numero, boite, codePostal, commune,
      dateDebut, dateFin,
      bailleurNom, bailleurPrenom, bailleurEmail, bailleurTelephone,
      locataireNom, locatairePrenom, locataireEmail, locataireTelephone,
      filePaths,
    } = data;

    // ── Step 1: Load portal client ──
    const { data: clientRow } = await supabase
      .from("portal_clients")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!clientRow) {
      return NextResponse.json(
        { error: "Client non configuré dans le portail. Contactez Axis Experts." },
        { status: 400 }
      );
    }

    const partnerId = ensureInt(clientRow.odoo_partner_id);
    const templatePrefix = clientRow.odoo_template_prefix;

    console.log("=== [Step 1] Portal client ===");
    console.log(`  partner_id (odoo_partner_id): ${partnerId}`);
    console.log(`  templatePrefix: ${templatePrefix}`);

    // ── Step 2: Resolve template ──
    const templateId = getTemplateId(templatePrefix, typeBien, typeMission as "entree" | "sortie");
    console.log(`=== [Step 2] Template: ${templateId} (${templatePrefix}/${typeBien}/${typeMission}) ===`);

    // ── Step 3: Address partner (search by name + zip, avoid duplicates) ──
    const adresseComplete = `${rue} ${numero}${boite ? ` bte ${boite}` : ""}, ${codePostal} ${commune}`;

    let adressePartnerId: number;
    const existingAddr = await odooSearch(
      "res.partner",
      [["name", "=", adresseComplete], ["zip", "=", String(codePostal)]],
      ["id"],
      1
    );

    if (existingAddr.length > 0) {
      adressePartnerId = ensureInt(existingAddr[0].id);
      console.log(`=== [Step 3] Address FOUND: id=${adressePartnerId} ===`);
    } else {
      adressePartnerId = await odooCreate("res.partner", {
        name: adresseComplete,
        street: `${rue} ${numero}${boite ? ` bte ${boite}` : ""}`,
        zip: String(codePostal),
        city: String(commune),
        country_id: 21,
        type: "other",
        parent_id: partnerId,
      });
      console.log(`=== [Step 3] Address CREATED: id=${adressePartnerId} ===`);
    }

    // ── Step 4: Bailleur partner ──
    const bailleurFullName = bailleurPrenom
      ? `${bailleurPrenom} ${bailleurNom}`.trim()
      : String(bailleurNom || "").trim();

    let bailleurPartnerId: number;
    const bailleurDomain: unknown[] = [["name", "=", bailleurFullName]];
    if (bailleurEmail) bailleurDomain.push(["email", "=", bailleurEmail]);
    const existingBailleur = await odooSearch("res.partner", bailleurDomain, ["id"], 1);

    if (existingBailleur.length > 0) {
      bailleurPartnerId = ensureInt(existingBailleur[0].id);
      console.log(`=== [Step 4] Bailleur FOUND: id=${bailleurPartnerId} name="${bailleurFullName}" ===`);
    } else {
      bailleurPartnerId = await odooCreate("res.partner", {
        name: bailleurFullName,
        email: bailleurEmail || false,
        phone: bailleurTelephone || false,
      });
      console.log(`=== [Step 4] Bailleur CREATED: id=${bailleurPartnerId} name="${bailleurFullName}" ===`);
    }

    // ── Step 5: Locataire partner (search by email first) ──
    const locataireFullName = `${locatairePrenom} ${locataireNom}`.trim();
    let locatairePartnerId: number;

    // Priority: search by email if provided
    if (locataireEmail) {
      const byEmail = await odooSearch("res.partner", [["email", "=", locataireEmail]], ["id", "name"], 1);
      if (byEmail.length > 0) {
        locatairePartnerId = ensureInt(byEmail[0].id);
        console.log(`=== [Step 5] Locataire FOUND by email: id=${locatairePartnerId} name="${byEmail[0].name}" ===`);
      } else {
        locatairePartnerId = await odooCreate("res.partner", {
          name: locataireFullName,
          email: locataireEmail,
          phone: locataireTelephone || false,
        });
        console.log(`=== [Step 5] Locataire CREATED: id=${locatairePartnerId} name="${locataireFullName}" email="${locataireEmail}" ===`);
      }
    } else {
      // No email: search by name
      const byName = await odooSearch("res.partner", [["name", "=", locataireFullName]], ["id"], 1);
      if (byName.length > 0) {
        locatairePartnerId = ensureInt(byName[0].id);
        console.log(`=== [Step 5] Locataire FOUND by name: id=${locatairePartnerId} ===`);
      } else {
        locatairePartnerId = await odooCreate("res.partner", {
          name: locataireFullName,
          phone: locataireTelephone || false,
        });
        console.log(`=== [Step 5] Locataire CREATED: id=${locatairePartnerId} name="${locataireFullName}" (no email) ===`);
      }
    }

    // ── Step 6: Build memo ──
    const memoLines: string[] = [];
    if (dateDebut && isValidDate(dateDebut)) {
      memoLines.push(`Date souhaitée: du ${dateDebut} au ${dateFin && isValidDate(dateFin) ? dateFin : "..."}`);
    }
    const bailleurParts = [bailleurFullName, bailleurEmail, bailleurTelephone].filter(Boolean);
    memoLines.push(`Bailleur: ${bailleurParts.join(" - ")}`);
    const locataireParts = [locataireFullName, locataireEmail, locataireTelephone].filter(Boolean);
    memoLines.push(`Locataire: ${locataireParts.join(" - ")}`);
    const memo = memoLines.join("\n");

    // ── Step 7: Map type de bien ──
    const typeBienOdoo = TYPE_BIEN_ODOO_MAP[typeBien] || typeBien;

    // ── Step 8: Create sale.order ──
    const orderValues: Record<string, unknown> = {
      partner_id: partnerId,
      x_studio_adresse_de_mission: ensureInt(adressePartnerId),
      x_studio_type_de_bien_1: typeBienOdoo,
      x_studio_type_de_client: "Bailleur",
      x_studio_partie_1_bailleurs_: ensureInt(bailleurPartnerId),
      x_studio_partie_2_locataires_: ensureInt(locatairePartnerId),
      x_studio_mmo_interne: memo,
    };

    if (templateId) {
      orderValues.sale_order_template_id = ensureInt(templateId);
    }

    console.log("=== [Step 8] sale.order payload ===");
    console.log(JSON.stringify(orderValues, null, 2));

    let orderId: number;
    try {
      orderId = await odooCreate("sale.order", orderValues);
      console.log(`=== [Step 8] sale.order CREATED: id=${orderId} ===`);
    } catch (odooErr) {
      console.error("=== [Step 8] sale.order FAILED ===");
      console.error("Payload:", JSON.stringify(orderValues, null, 2));
      console.error("Error:", odooErr);
      throw odooErr;
    }

    // ── Step 9: Apply quote template (trigger onchange to populate lines) ──
    if (templateId) {
      try {
        // Write the template to trigger Odoo's template application
        await odooExecute("sale.order", "write", [[orderId], {
          sale_order_template_id: ensureInt(templateId),
        }]);
        console.log(`=== [Step 9a] Template ${templateId} written to order ${orderId} ===`);

        // Trigger the onchange to populate order lines from the template
        try {
          await odooExecute("sale.order", "_onchange_sale_order_template_id", [[orderId]]);
          console.log(`=== [Step 9b] _onchange_sale_order_template_id called ===`);
        } catch {
          console.log(`=== [Step 9b] _onchange failed, trying onchange... ===`);
          try {
            await odooExecute("sale.order", "onchange", [
              [orderId],
              { sale_order_template_id: ensureInt(templateId) },
              ["sale_order_template_id"],
              { sale_order_template_id: "1" },
            ]);
            console.log(`=== [Step 9b] onchange called ===`);
          } catch (onchangeErr) {
            console.warn(`=== [Step 9b] onchange also failed:`, onchangeErr);
          }
        }
      } catch (templateErr) {
        console.error(`=== [Step 9] Template application failed:`, templateErr);
      }
    }

    // ── Step 10: Update note lines with real data ──
    try {
      const lines = await odooSearch(
        "sale.order.line",
        [["order_id", "=", orderId]],
        ["id", "name", "display_type"],
        0
      );
      console.log(`=== [Step 10] Found ${lines.length} order lines ===`);

      for (const line of lines) {
        const lineId = ensureInt(line.id);
        const name = String(line.name || "");

        if (name.includes("Adresse de l'immeuble concern")) {
          const newName = `Adresse de l'immeuble concerné : ${rue} ${numero}${boite ? ` bte ${boite}` : ""}, ${codePostal} ${commune}`;
          await odooExecute("sale.order.line", "write", [[lineId], { name: newName }]);
          console.log(`  Line ${lineId}: updated address → "${newName}"`);
        }

        if (name.includes("Nom du locataire")) {
          const newName = `Nom du locataire : ${locatairePrenom} ${locataireNom}`;
          await odooExecute("sale.order.line", "write", [[lineId], { name: newName }]);
          console.log(`  Line ${lineId}: updated locataire → "${newName}"`);
        }
      }
    } catch (lineErr) {
      console.warn("=== [Step 10] Line update failed (non-blocking):", lineErr);
    }

    // ── Step 11: Attach files from Supabase Storage ──
    async function attachFromStorage(storagePath: string, label: string) {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("rdv-documents")
        .download(storagePath);

      if (dlErr || !fileData) {
        console.error(`[Storage] Failed to download ${storagePath}:`, dlErr);
        return;
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const base64 = buffer.toString("base64");
      const ext = storagePath.split(".").pop() || "pdf";
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      };

      const attachId = await odooCreate("ir.attachment", {
        name: `${label} - ${adresseComplete}`,
        datas: base64,
        res_model: "sale.order",
        res_id: ensureInt(orderId),
        mimetype: mimeMap[ext] || "application/octet-stream",
      });
      console.log(`=== [Step 11] Attachment "${label}": id=${attachId} ===`);
    }

    if (filePaths?.bail) await attachFromStorage(filePaths.bail, "Bail");
    if (filePaths?.edlEntree) await attachFromStorage(filePaths.edlEntree, "EDL Entrée");

    // ── Step 12: Send emails ──
    const missionLabel = typeMission === "entree" ? "Entrée locative" : "Sortie locative";
    const emailHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F5B800; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Axis Experts</h1>
          <p style="color: #ffffff; margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Nouvelle demande de rendez-vous</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Mission</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${missionLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Bien</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${typeBienOdoo}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Adresse</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${adresseComplete}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Bailleur</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${bailleurFullName}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Locataire</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${locataireFullName}</td></tr>
            ${dateDebut && isValidDate(dateDebut) ? `<tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Date souhaitée</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">Du ${dateDebut} au ${dateFin && isValidDate(dateFin) ? dateFin : "..."}</td></tr>` : ""}
          </table>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;">
          <p style="color: #737373; font-size: 13px; margin: 0;">Devis Odoo #${orderId} créé automatiquement.</p>
        </div>
      </div>
    `;

    const emailRecipients = ["n.rommiee@axis-experts.be"];
    if (bailleurEmail) emailRecipients.push(bailleurEmail);

    await resend.emails.send({
      from: "Axis Experts <noreply@axis-experts.be>",
      to: emailRecipients,
      subject: `Nouvelle demande EDL - ${missionLabel} - ${adresseComplete}`,
      html: emailHtml,
    });
    console.log(`=== [Step 12] Email sent to: ${emailRecipients.join(", ")} ===`);

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("submit-rdv error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
