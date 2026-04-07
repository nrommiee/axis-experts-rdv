import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { odooCreate, odooSearch, getTemplateId } from "@/lib/odoo";
import { TYPE_BIEN_ODOO_MAP } from "@/lib/types";
import { Resend } from "resend";

// Vercel route segment config
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

// Validate YYYY-MM-DD date format
function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

// Ensure a value is an integer for Odoo many2one fields
function ensureInt(val: unknown): number {
  if (typeof val === "number") return Math.floor(val);
  if (typeof val === "string") return parseInt(val, 10);
  return 0;
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // 2. Parse JSON body
    const data = await request.json();

    const {
      typeMission,
      typeBien,
      rue,
      numero,
      boite,
      codePostal,
      commune,
      dateDebut,
      dateFin,
      bailleurNom,
      bailleurPrenom,
      bailleurEmail,
      bailleurTelephone,
      locataireNom,
      locatairePrenom,
      locataireEmail,
      locataireTelephone,
      filePaths,
    } = data;

    // 3. Get client info from portal_clients table
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

    // partner_id = odoo_partner_id from portal_clients (e.g. 60713 for CPAS BXL)
    const partnerId = ensureInt(clientRow.odoo_partner_id);
    const templatePrefix = clientRow.odoo_template_prefix;

    console.log("=== [Step 1] Portal client loaded ===");
    console.log(`  supabaseUserId: ${user.id}`);
    console.log(`  odoo_partner_id (partner_id for sale.order): ${partnerId}`);
    console.log(`  templatePrefix: ${templatePrefix}`);

    // 4. Resolve Odoo template
    const templateId = getTemplateId(
      templatePrefix,
      typeBien,
      typeMission as "entree" | "sortie"
    );
    console.log(`=== [Step 2] Template resolved: ${templateId} (prefix=${templatePrefix}, bien=${typeBien}, mission=${typeMission}) ===`);

    // 5. Build full address string
    const adresseComplete = `${rue} ${numero}${boite ? ` bte ${boite}` : ""}, ${codePostal} ${commune}`;

    // ──────────────────────────────────────────────
    // 6. Create or find ADDRESS partner in Odoo
    // ──────────────────────────────────────────────
    let adressePartnerId: number;
    const existingAddr = await odooSearch(
      "res.partner",
      [["name", "=", adresseComplete], ["type", "=", "other"]],
      ["id"],
      1
    );

    if (existingAddr.length > 0) {
      adressePartnerId = ensureInt(existingAddr[0].id);
      console.log(`=== [Step 3] Address partner FOUND: id=${adressePartnerId} name="${adresseComplete}" ===`);
    } else {
      adressePartnerId = await odooCreate("res.partner", {
        name: adresseComplete,
        street: `${rue} ${numero}${boite ? ` bte ${boite}` : ""}`,
        zip: String(codePostal),
        city: String(commune),
        country_id: 21, // Belgium
        type: "other",
        parent_id: partnerId,
      });
      console.log(`=== [Step 3] Address partner CREATED: id=${adressePartnerId} name="${adresseComplete}" parent_id=${partnerId} ===`);
    }

    // ──────────────────────────────────────────────
    // 7. Create or find BAILLEUR partner in Odoo
    // ──────────────────────────────────────────────
    const bailleurFullName = bailleurPrenom
      ? `${bailleurPrenom} ${bailleurNom}`.trim()
      : String(bailleurNom || "").trim();

    let bailleurPartnerId: number;
    const bailleurDomain: unknown[] = [["name", "=", bailleurFullName]];
    if (bailleurEmail) bailleurDomain.push(["email", "=", bailleurEmail]);
    const existingBailleur = await odooSearch(
      "res.partner",
      bailleurDomain,
      ["id"],
      1
    );

    if (existingBailleur.length > 0) {
      bailleurPartnerId = ensureInt(existingBailleur[0].id);
      console.log(`=== [Step 4] Bailleur partner FOUND: id=${bailleurPartnerId} name="${bailleurFullName}" ===`);
    } else {
      bailleurPartnerId = await odooCreate("res.partner", {
        name: bailleurFullName,
        email: bailleurEmail || false,
        phone: bailleurTelephone || false,
      });
      console.log(`=== [Step 4] Bailleur partner CREATED: id=${bailleurPartnerId} name="${bailleurFullName}" email="${bailleurEmail}" ===`);
    }

    // ──────────────────────────────────────────────
    // 8. Create or find LOCATAIRE partner in Odoo
    // ──────────────────────────────────────────────
    const locataireFullName = `${locatairePrenom} ${locataireNom}`.trim();
    let locatairePartnerId: number;
    const locDomain: unknown[] = [["name", "=", locataireFullName]];
    if (locataireEmail) locDomain.push(["email", "=", locataireEmail]);
    const existingLoc = await odooSearch(
      "res.partner",
      locDomain,
      ["id"],
      1
    );

    if (existingLoc.length > 0) {
      locatairePartnerId = ensureInt(existingLoc[0].id);
      console.log(`=== [Step 5] Locataire partner FOUND: id=${locatairePartnerId} name="${locataireFullName}" ===`);
    } else {
      locatairePartnerId = await odooCreate("res.partner", {
        name: locataireFullName,
        email: locataireEmail || false,
        phone: locataireTelephone || false,
      });
      console.log(`=== [Step 5] Locataire partner CREATED: id=${locatairePartnerId} name="${locataireFullName}" email="${locataireEmail}" ===`);
    }

    // ──────────────────────────────────────────────
    // 9. Build structured memo
    // ──────────────────────────────────────────────
    const memoLines: string[] = [];

    if (dateDebut && isValidDate(dateDebut)) {
      const dateFinStr = dateFin && isValidDate(dateFin) ? dateFin : "...";
      memoLines.push(`Date souhaitée: du ${dateDebut} au ${dateFinStr}`);
    }

    const bailleurParts = [bailleurFullName, bailleurEmail, bailleurTelephone].filter(Boolean);
    memoLines.push(`Bailleur: ${bailleurParts.join(" - ")}`);

    const locataireParts = [locataireFullName, locataireEmail, locataireTelephone].filter(Boolean);
    memoLines.push(`Locataire: ${locataireParts.join(" - ")}`);

    const memo = memoLines.join("\n");

    // 10. Map type de bien to Odoo selection value
    const typeBienOdoo = TYPE_BIEN_ODOO_MAP[typeBien] || typeBien;

    // ──────────────────────────────────────────────
    // 11. Create sale.order in Odoo
    // ──────────────────────────────────────────────
    const orderValues: Record<string, unknown> = {
      partner_id: partnerId,
      x_studio_adresse_de_mission: ensureInt(adressePartnerId),
      x_studio_type_de_bien_1: typeBienOdoo,
      x_studio_partie_1_bailleurs_: ensureInt(bailleurPartnerId),
      x_studio_partie_2_locataires_: ensureInt(locatairePartnerId),
      x_studio_mmo_interne: memo,
    };

    if (templateId) {
      orderValues.sale_order_template_id = ensureInt(templateId);
    }

    console.log("=== [Step 6] sale.order payload ===");
    console.log(JSON.stringify(orderValues, null, 2));
    console.log("=== [Step 6] Verification ===");
    console.log(`  partner_id: ${partnerId} (from portal_clients.odoo_partner_id)`);
    console.log(`  x_studio_adresse_de_mission: ${ensureInt(adressePartnerId)} (res.partner for address)`);
    console.log(`  x_studio_partie_1_bailleurs_: ${ensureInt(bailleurPartnerId)} (res.partner for bailleur "${bailleurFullName}")`);
    console.log(`  x_studio_partie_2_locataires_: ${ensureInt(locatairePartnerId)} (res.partner for locataire "${locataireFullName}")`);
    console.log(`  x_studio_type_de_bien_1: "${typeBienOdoo}"`);
    console.log(`  sale_order_template_id: ${templateId ?? "none"}`);
    console.log(`  x_studio_mmo_interne: "${memo}"`);

    let orderId: number;
    try {
      orderId = await odooCreate("sale.order", orderValues);
      console.log(`=== [Step 7] sale.order CREATED: id=${orderId} ===`);
    } catch (odooErr) {
      console.error("=== [Step 7] sale.order creation FAILED ===");
      console.error("Payload:", JSON.stringify(orderValues, null, 2));
      console.error("Error:", odooErr);
      throw odooErr;
    }

    // ──────────────────────────────────────────────
    // 12. Download files from Supabase Storage and attach to Odoo
    // ──────────────────────────────────────────────
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
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
      };

      const attachId = await odooCreate("ir.attachment", {
        name: `${label} - ${adresseComplete}`,
        datas: base64,
        res_model: "sale.order",
        res_id: ensureInt(orderId),
        mimetype: mimeMap[ext] || "application/octet-stream",
      });

      console.log(`=== [Step 8] Attachment "${label}" created: id=${attachId} for order ${orderId} ===`);
    }

    if (filePaths?.bail) await attachFromStorage(filePaths.bail, "Bail");
    if (filePaths?.edlEntree) await attachFromStorage(filePaths.edlEntree, "EDL Entrée");

    // ──────────────────────────────────────────────
    // 13. Send confirmation emails via Resend
    // ──────────────────────────────────────────────
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

    console.log(`=== [Step 9] Confirmation email sent to: ${emailRecipients.join(", ")} ===`);

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("submit-rdv error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
