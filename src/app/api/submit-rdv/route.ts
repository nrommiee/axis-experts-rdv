import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooCreate, odooExecute, odooSearch, getTemplateId } from "@/lib/odoo";
import { TYPE_BIEN_ODOO_MAP } from "@/lib/types";
import { Resend } from "resend";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function ensureInt(val: unknown): number {
  if (Array.isArray(val)) return ensureInt(val[0]);
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

    const data = await request.json();
    const {
      typeMission, typeBien, rue, numero, boite, codePostal, commune,
      dateDebut, dateFin,
      bailleurNom, bailleurPrenom, bailleurEmail, bailleurTelephone,
      locataireNom, locatairePrenom, locataireEmail, locataireTelephone,
      filePaths,
    } = data;

    // ══════════════════════════════════════════════
    // Step 1: Load portal client
    // ══════════════════════════════════════════════
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
    console.log(`=== [Step 1] Portal: partner_id=${partnerId} prefix=${templatePrefix} ===`);

    // ══════════════════════════════════════════════
    // Step 2: Resolve template
    // ══════════════════════════════════════════════
    const templateId = getTemplateId(templatePrefix, typeBien, typeMission as "entree" | "sortie");
    console.log(`=== [Step 2] Template: ${templateId} (${templatePrefix}/${typeBien}/${typeMission}) ===`);

    // ══════════════════════════════════════════════
    // Step 3: ALWAYS create new address partner (independent, no parent)
    // ══════════════════════════════════════════════
    const adresseComplete = `${rue} ${numero}${boite ? ` bte ${boite}` : ""}, ${codePostal} ${commune}`;
    const adressePartnerRaw = await odooCreate("res.partner", {
      name: adresseComplete,
      street: `${rue} ${numero}${boite ? ` bte ${boite}` : ""}`,
      zip: String(codePostal),
      city: String(commune),
      country_id: 21,
      type: "other",
    });
    const adressePartnerId = ensureInt(adressePartnerRaw);
    console.log(`=== [Step 3] Address CREATED: raw=${JSON.stringify(adressePartnerRaw)} → id=${adressePartnerId} ===`);

    // ══════════════════════════════════════════════
    // Step 4: Bailleur partner
    // ══════════════════════════════════════════════
    const bailleurFullName = bailleurPrenom
      ? `${bailleurPrenom} ${bailleurNom}`.trim()
      : String(bailleurNom || "").trim();

    let bailleurPartnerId: number;
    const bailleurDomain: unknown[] = [["name", "=", bailleurFullName]];
    if (bailleurEmail) bailleurDomain.push(["email", "=", bailleurEmail]);
    const existingBailleur = await odooSearch("res.partner", bailleurDomain, ["id"], 1);

    if (existingBailleur.length > 0) {
      bailleurPartnerId = ensureInt(existingBailleur[0].id);
      console.log(`=== [Step 4] Bailleur FOUND: id=${bailleurPartnerId} ===`);
    } else {
      bailleurPartnerId = await odooCreate("res.partner", {
        name: bailleurFullName,
        email: bailleurEmail || false,
        phone: bailleurTelephone || false,
      });
      console.log(`=== [Step 4] Bailleur CREATED: id=${bailleurPartnerId} ===`);
    }

    // ══════════════════════════════════════════════
    // Step 5: Locataire partner (search by email, update if found)
    // ══════════════════════════════════════════════
    const locataireFullName = `${locatairePrenom} ${locataireNom}`.trim();
    let locatairePartnerId: number;

    if (locataireEmail) {
      const byEmail = await odooSearch("res.partner", [["email", "=", locataireEmail]], ["id", "name"], 1);
      if (byEmail.length > 0) {
        locatairePartnerId = ensureInt(byEmail[0].id);
        const updateVals: Record<string, unknown> = { name: locataireFullName };
        if (locataireTelephone) updateVals.phone = locataireTelephone;
        await odooExecute("res.partner", "write", [[locatairePartnerId], updateVals]);
        console.log(`=== [Step 5] Locataire FOUND by email: raw=${JSON.stringify(byEmail[0].id)} → id=${locatairePartnerId} ===`);
      } else {
        const locRaw = await odooCreate("res.partner", {
          name: locataireFullName,
          email: locataireEmail,
          phone: locataireTelephone || false,
        });
        locatairePartnerId = ensureInt(locRaw);
        console.log(`=== [Step 5] Locataire CREATED: raw=${JSON.stringify(locRaw)} → id=${locatairePartnerId} ===`);
      }
    } else {
      const byName = await odooSearch("res.partner", [["name", "=", locataireFullName]], ["id"], 1);
      if (byName.length > 0) {
        locatairePartnerId = ensureInt(byName[0].id);
        if (locataireTelephone) {
          await odooExecute("res.partner", "write", [[locatairePartnerId], { phone: locataireTelephone }]);
        }
        console.log(`=== [Step 5] Locataire FOUND by name: raw=${JSON.stringify(byName[0].id)} → id=${locatairePartnerId} ===`);
      } else {
        const locRaw = await odooCreate("res.partner", {
          name: locataireFullName,
          phone: locataireTelephone || false,
        });
        locatairePartnerId = ensureInt(locRaw);
        console.log(`=== [Step 5] Locataire CREATED: raw=${JSON.stringify(locRaw)} → id=${locatairePartnerId} (no email) ===`);
      }
    }

    // ══════════════════════════════════════════════
    // Step 6: Resolve tag_ids for mission type (ELE/ELS)
    // ══════════════════════════════════════════════
    const tagName = typeMission === "entree" ? "ELE" : "ELS";
    let tagIds: unknown[] | undefined;

    // Try sale.order.tag first, then crm.tag
    for (const tagModel of ["sale.order.tag", "crm.tag"]) {
      try {
        const tags = await odooExecute(tagModel, "search_read", [
          [["name", "=", tagName]],
        ], { fields: ["id", "name"], limit: 1 }) as Record<string, unknown>[];
        if (tags.length > 0) {
          tagIds = [[4, ensureInt(tags[0].id)]];
          console.log(`=== [Step 6] Tag "${tagName}" found in ${tagModel}: id=${tags[0].id} ===`);
          break;
        }
      } catch {
        console.log(`=== [Step 6] Model ${tagModel} not available, trying next... ===`);
      }
    }
    if (!tagIds) {
      console.log(`=== [Step 6] Tag "${tagName}" not found in any model ===`);
    }

    const typeBienOdoo = TYPE_BIEN_ODOO_MAP[typeBien] || typeBien;

    // ══════════════════════════════════════════════
    // Step 8: Create sale.order
    // ══════════════════════════════════════════════
    // Verify all IDs are valid integers before building payload
    console.log(`=== [Step 8] ID check: adresse=${adressePartnerId} bailleur=${bailleurPartnerId} locataire=${locatairePartnerId} partner=${partnerId} ===`);

    const orderValues: Record<string, unknown> = {
      partner_id: partnerId,
      x_studio_adresse_de_mission: adressePartnerId,
      x_studio_type_de_bien_1: typeBienOdoo,
      x_studio_type_de_client: "Bailleur",
      x_studio_partie_1_bailleurs_: bailleurPartnerId,
      x_studio_partie_2_locataires_: locatairePartnerId,
    };

    if (templateId) {
      orderValues.sale_order_template_id = ensureInt(templateId);
    }
    if (tagIds) {
      orderValues.tag_ids = tagIds;
    }

    console.log("=== [Step 8] sale.order payload ===");
    console.log(`  partner_id=${partnerId} adresse=${ensureInt(adressePartnerId)} bailleur=${ensureInt(bailleurPartnerId)} locataire=${ensureInt(locatairePartnerId)}`);
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

    // ── Step 8b: Force address (onchange from partner_id may overwrite it) ──
    try {
      await odooExecute("sale.order", "write", [[orderId], {
        x_studio_adresse_de_mission: adressePartnerId,
      }]);
      console.log(`=== [Step 8b] Address forced on order ${orderId}: x_studio_adresse_de_mission=${adressePartnerId} ===`);
    } catch (writeErr) {
      console.error(`=== [Step 8b] Address write failed:`, writeErr);
    }

    // ══════════════════════════════════════════════
    // Step 9: Copy template lines from sale.order.template.line
    // ══════════════════════════════════════════════
    if (templateId) {
      try {
        const templateLines = await odooExecute(
          "sale.order.template.line",
          "search_read",
          [[["sale_order_template_id", "=", ensureInt(templateId)]]],
          {
            fields: ["id", "name", "product_id", "product_uom_qty", "display_type", "sequence"],
            order: "sequence asc",
          }
        ) as Record<string, unknown>[];

        console.log(`=== [Step 9] Template has ${templateLines.length} lines ===`);

        const createdLineIds: { id: number; name: string; displayType: unknown }[] = [];

        for (const tLine of templateLines) {
          const lineVals: Record<string, unknown> = {
            order_id: orderId,
            name: String(tLine.name || ""),
            sequence: ensureInt(tLine.sequence),
          };

          const displayType = tLine.display_type;
          if (displayType && displayType !== false) {
            // Section or note line
            lineVals.display_type = displayType;
          } else {
            // Product line — Odoo will auto-fill price from product
            lineVals.display_type = false;
            const productId = tLine.product_id;
            if (Array.isArray(productId) && productId.length > 0) {
              lineVals.product_id = ensureInt(productId[0]);
            }
            lineVals.product_uom_qty = tLine.product_uom_qty || 1;
          }

          const lineId = await odooCreate("sale.order.line", lineVals);
          createdLineIds.push({
            id: lineId,
            name: String(tLine.name || ""),
            displayType,
          });
          console.log(`  Line created: id=${lineId} type=${displayType || "product"} name="${String(tLine.name || "").substring(0, 60)}"`);
        }

        // ══════════════════════════════════════════════
        // Step 10: Update note lines with real data
        // ══════════════════════════════════════════════
        for (const line of createdLineIds) {
          const name = line.name;

          if (name.includes("Adresse de l'immeuble concern") || name.includes("Adresse de l\u2019immeuble")) {
            const newName = `Adresse de l'immeuble concerné : ${rue} ${numero}${boite ? ` bte ${boite}` : ""}, ${codePostal} ${commune}`;
            await odooExecute("sale.order.line", "write", [[line.id], { name: newName }]);
            console.log(`=== [Step 10] Line ${line.id}: address updated ===`);
          }

          if (name.includes("Nom du locataire")) {
            const newName = `Nom du locataire : ${locatairePrenom} ${locataireNom}`;
            await odooExecute("sale.order.line", "write", [[line.id], { name: newName }]);
            console.log(`=== [Step 10] Line ${line.id}: locataire updated ===`);
          }
        }

      } catch (templateErr) {
        console.error("=== [Step 9-10] Template lines failed (non-blocking):", templateErr);
      }
    }

    // ══════════════════════════════════════════════
    // Step 11: Attach files from Supabase Storage (service role)
    // ══════════════════════════════════════════════
    const supabaseAdmin = createAdminClient();

    async function attachFromStorage(storagePath: string) {
      try {
        const { data: fileData, error: dlErr } = await supabaseAdmin.storage
          .from("rdv-documents")
          .download(storagePath);

        if (dlErr || !fileData) {
          console.error(`=== [Step 11] Download failed for "${storagePath}":`, dlErr?.message);
          return;
        }

        // Use original filename from the storage path
        const originalName = storagePath.split("/").pop() || storagePath;
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const base64 = buffer.toString("base64");
        const ext = originalName.split(".").pop()?.toLowerCase() || "pdf";
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        };

        const attachId = await odooCreate("ir.attachment", {
          name: originalName,
          datas: base64,
          res_model: "sale.order",
          res_id: ensureInt(orderId),
          mimetype: mimeMap[ext] || "application/octet-stream",
          type: "binary",
        });
        console.log(`=== [Step 11] Attachment "${originalName}": id=${attachId} ===`);
      } catch (attachErr) {
        console.error(`=== [Step 11] Attachment failed (non-blocking):`, attachErr);
      }
    }

    if (filePaths?.bail) await attachFromStorage(filePaths.bail);
    if (filePaths?.edlEntree) await attachFromStorage(filePaths.edlEntree);

    // ══════════════════════════════════════════════
    // Step 12: Send emails
    // ══════════════════════════════════════════════
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
