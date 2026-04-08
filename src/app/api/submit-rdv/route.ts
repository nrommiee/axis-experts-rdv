import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooCreate, odooExecute, odooSearch, getTemplateId } from "@/lib/odoo";
import { TYPE_BIEN_ODOO_MAP, getTypeBienFromDefaultCode } from "@/lib/types";
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateBody(data: Record<string, unknown>): string | null {
  const s = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";

  if (!["entree", "sortie"].includes(s("typeMission"))) return "typeMission invalide (entree ou sortie attendu)";
  if (!s("rue")) return "Champ rue requis";
  if (!s("numero")) return "Champ numéro requis";
  if (!/^\d{4}$/.test(s("codePostal"))) return "Code postal invalide (4 chiffres attendus)";
  if (!s("commune")) return "Champ commune requis";
  if (!s("locataireNom")) return "Nom du locataire requis";
  if (!s("locatairePrenom")) return "Prénom du locataire requis";

  if (!s("bailleurNom")) return "Nom du bailleur requis";

  const bailleurEmail = s("bailleurEmail");
  if (bailleurEmail && !isValidEmail(bailleurEmail)) return "Email bailleur invalide";

  const locataireEmail = s("locataireEmail");
  if (locataireEmail && !isValidEmail(locataireEmail)) return "Email locataire invalide";

  if (data.representantEnabled) {
    if (!s("representantNom")) return "Nom du représentant requis";
    const repEmail = s("representantEmail");
    if (repEmail && !isValidEmail(repEmail)) return "Email du représentant invalide";
  }

  const dateDebut = s("dateDebut");
  const dateFin = s("dateFin");
  if (dateDebut && !isValidDate(dateDebut)) return "Date début invalide";
  if (dateFin && !isValidDate(dateFin)) return "Date fin invalide";

  return null;
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
      locataireNewRue, locataireNewNumero, locataireNewBoite,
      locataireNewCodePostal, locataireNewCommune,
      representantEnabled, representantPrenom, representantNom,
      representantRole, representantEmail, representantTelephone,
      locataireDecede, numeroPO,
      notesLibres, compteurEau, compteurGaz, compteurElec,
      selectedProduct, selectedOptions,
      documents,
    } = data;

    // ── Validation ──
    const validationError = validateBody(data);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

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
    // Step 2: Resolve template (only when no product selected)
    // ══════════════════════════════════════════════
    const useProductLines = !!(selectedProduct && selectedProduct.id);
    const templateId = useProductLines
      ? null
      : getTemplateId(templatePrefix, typeBien, typeMission as "entree" | "sortie");
    console.log(`=== [Step 2] useProductLines=${useProductLines} Template: ${templateId} (${templatePrefix}/${typeBien}/${typeMission}) ===`);

    // ══════════════════════════════════════════════
    // Step 3: ALWAYS create new address partner (child of client, type=delivery)
    // ══════════════════════════════════════════════
    // Resolve Belgium country_id dynamically
    let belgiumCountryId = 21; // fallback
    try {
      const countries = await odooExecute("res.country", "search_read", [
        [["code", "=", "BE"]],
      ], { fields: ["id", "name"], limit: 1 }) as Record<string, unknown>[];
      if (countries.length > 0) {
        belgiumCountryId = ensureInt(countries[0].id);
      }
      console.log(`=== [Step 3] Belgium country_id: ${belgiumCountryId} ===`);
    } catch {
      console.log(`=== [Step 3] Country lookup failed, using fallback ${belgiumCountryId} ===`);
    }

    const adresseComplete = `${rue} ${numero}, ${codePostal} ${commune}`;
    const adresseStreet = `${rue}, ${numero}${boite ? `, ${boite}` : ""}`;

    const adressePartnerRaw = await odooCreate("res.partner", {
      name: adresseComplete,
      street: adresseStreet,
      zip: String(codePostal),
      city: String(commune),
      country_id: belgiumCountryId,
      type: "delivery",
      parent_id: partnerId,
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
    let existingBailleur: Record<string, unknown>[] = [];

    // Search by email first (more reliable), then fallback to name
    if (bailleurEmail) {
      existingBailleur = await odooSearch("res.partner", [["email", "=", bailleurEmail]], ["id"], 1);
      if (existingBailleur.length > 0) {
        console.log(`=== [Step 4] Bailleur FOUND by email: id=${existingBailleur[0].id} ===`);
      }
    }
    if (existingBailleur.length === 0) {
      const nameDomain: unknown[] = [["name", "=", bailleurFullName]];
      if (bailleurEmail) nameDomain.push(["email", "=", bailleurEmail]);
      existingBailleur = await odooSearch("res.partner", nameDomain, ["id"], 1);
      if (existingBailleur.length > 0) {
        console.log(`=== [Step 4] Bailleur FOUND by name: id=${existingBailleur[0].id} ===`);
      }
    }

    if (existingBailleur.length > 0) {
      bailleurPartnerId = ensureInt(existingBailleur[0].id);
    } else if (!bailleurFullName) {
      return NextResponse.json({ error: "Nom du bailleur manquant" }, { status: 400 });
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
        const existingName = String(byEmail[0].name || "");
        // Don't overwrite existing name — only update phone if provided
        if (existingName && existingName !== locataireFullName) {
          console.warn(`=== [Step 5] Locataire name mismatch: existing="${existingName}", incoming="${locataireFullName}" — keeping existing ===`);
        }
        const updateVals: Record<string, unknown> = {};
        if (locataireTelephone) updateVals.phone = locataireTelephone;
        if (Object.keys(updateVals).length > 0) {
          await odooExecute("res.partner", "write", [[locatairePartnerId], updateVals]);
        }
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
    // Step 5b: Représentant locataire partner
    // ══════════════════════════════════════════════
    let representantPartnerId: number | null = null;

    if (representantEnabled && representantNom) {
      const representantFullName = `${representantPrenom || ""} ${representantNom}`.trim();

      // Validate representative email if provided
      if (representantEmail && !isValidEmail(representantEmail)) {
        return NextResponse.json({ error: "Email du représentant invalide" }, { status: 400 });
      }

      // Search by email first, then by name
      let existingRep: Record<string, unknown>[] = [];
      if (representantEmail) {
        existingRep = await odooSearch("res.partner", [["email", "=", representantEmail]], ["id"], 1);
        if (existingRep.length > 0) {
          console.log(`=== [Step 5b] Représentant FOUND by email: id=${existingRep[0].id} ===`);
        }
      }
      if (existingRep.length === 0) {
        existingRep = await odooSearch("res.partner", [["name", "=", representantFullName]], ["id"], 1);
        if (existingRep.length > 0) {
          console.log(`=== [Step 5b] Représentant FOUND by name: id=${existingRep[0].id} ===`);
        }
      }

      if (existingRep.length > 0) {
        representantPartnerId = ensureInt(existingRep[0].id);
      } else {
        representantPartnerId = await odooCreate("res.partner", {
          name: representantFullName,
          email: representantEmail || false,
          phone: representantTelephone || false,
          function: representantRole || false,
        });
        console.log(`=== [Step 5b] Représentant CREATED: id=${representantPartnerId} ===`);
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

    const typeBienOdoo = useProductLines
      ? getTypeBienFromDefaultCode(selectedProduct.defaultCode || "")
      : (TYPE_BIEN_ODOO_MAP[typeBien] || typeBien);

    // ══════════════════════════════════════════════
    // Step 7b: Bailleur fallback — use client partner if bailleur is missing
    // ══════════════════════════════════════════════
    console.log('[DEBUG] bailleurPartnerId:', bailleurPartnerId, 'clientRow.odoo_partner_id:', clientRow.odoo_partner_id);
    if (!bailleurPartnerId) {
      bailleurPartnerId = ensureInt(clientRow.odoo_partner_id) || partnerId;
      console.log(`[DEBUG] bailleurPartnerId was 0/falsy, using odoo_partner_id as fallback: ${bailleurPartnerId}`);
    }

    // ══════════════════════════════════════════════
    // Step 8: Create sale.order
    // ══════════════════════════════════════════════
    // Verify all IDs are valid integers before building payload
    console.log(`=== [Step 8] ID check: adresse=${adressePartnerId} bailleur=${bailleurPartnerId} locataire=${locatairePartnerId} partner=${partnerId} ===`);

    const orderValues: Record<string, unknown> = {
      partner_id: partnerId,
      partner_shipping_id: adressePartnerId,
      x_studio_adresse_de_mission: adressePartnerId,
      x_studio_type_de_bien_1: typeBienOdoo,
      x_studio_type_de_client: "Bailleur",
      x_studio_partie_1_bailleurs_: [[4, bailleurPartnerId]],
      x_studio_partie_2_locataires_: [[4, locatairePartnerId]],
    };

    if (templateId) {
      orderValues.sale_order_template_id = ensureInt(templateId);
    }
    if (tagIds) {
      orderValues.tag_ids = tagIds;
    }
    if (representantPartnerId) {
      orderValues.x_studio_conseil_intervenant_2_ = [[4, representantPartnerId]];
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

    // Set initial RDV status (non-blocking)
    try {
      await odooExecute("sale.order", "write", [[orderId], { x_studio_suivi_expert: "En cours" }]);
      console.log(`=== [Step 8b] x_studio_suivi_expert set to "En cours" for order ${orderId} ===`);
    } catch (statusErr) {
      console.error(`=== [Step 8b] Failed to set suivi_expert:`, statusErr);
    }

    // ══════════════════════════════════════════════
    // Step 9: Create order lines
    // ══════════════════════════════════════════════
    if (useProductLines) {
      // ── Product-based lines (from form selection) ──
        // ── Section header (before product lines) ──
        const sectionName = typeMission === "entree"
          ? "ÉTAT DES LIEUX D'ENTRÉE LOCATIVE : Gestion rendez-vous, déplacement, Visite et examen d'entrée locative, Récolement, Relevés compteurs identifiés et accessibles, Procès-verbal contradictoire, envoi rapport."
          : "ÉTAT DES LIEUX DE SORTIE LOCATIVE : Gestion rendez-vous, déplacement, Visite et examen de sortie locative immeuble, Récolement, Détermination et valorisations des dégâts locatifs, Relevés compteurs identifiés et accessibles (pas transferts) / Clés & Attestations présentées, Procès-verbal d'indemnité de dégâts ou manquements locatifs, envoi rapport.";

        const sectionLineId = await odooCreate("sale.order.line", {
          order_id: orderId,
          name: sectionName,
          display_type: "line_section",
          product_uom_qty: 0,
          price_unit: 0,
        });
        console.log(`  Section line created: id=${sectionLineId}`);

        // ── Product lines ──
        const items = [selectedProduct, ...(Array.isArray(selectedOptions) ? selectedOptions : [])];
        console.log(`=== [Step 9] Creating ${items.length} product-based order line(s) ===`);

        for (const item of items) {
          // sale.order.line requires a product.product (variant) ID,
          // but item.id is a product.template ID — resolve the variant.
          const productTmplId = ensureInt(item.id);
          let productProductId = productTmplId; // fallback
          try {
            const variants = await odooExecute("product.product", "search_read", [
              [["product_tmpl_id", "=", productTmplId]],
            ], { fields: ["id"], limit: 1 }) as Record<string, unknown>[];
            if (variants.length > 0) {
              productProductId = ensureInt(variants[0].id);
              console.log(`  Resolved product.template ${productTmplId} → product.product ${productProductId}`);
            } else {
              console.warn(`  No product.product found for product_tmpl_id=${productTmplId}, using template ID as fallback`);
            }
          } catch (variantErr) {
            console.warn(`  product.product lookup failed for template ${productTmplId}, using fallback:`, variantErr);
          }

          const lineVals = {
            order_id: orderId,
            product_id: productProductId,
            name: String(item.odooName || ""),
            product_uom_qty: 1,
            price_unit: item.listPrice ?? 0,
          };
          console.log(`  Creating sale.order.line: order_id=${orderId} product_id=${productProductId} (tmpl=${productTmplId}) price=${lineVals.price_unit} name="${String(item.odooName || "").substring(0, 60)}"`);
          const lineId = await odooCreate("sale.order.line", lineVals);
          console.log(`  Line created: id=${lineId} product_id=${productProductId} (tmpl=${productTmplId}) name="${String(item.odooName || "").substring(0, 60)}" price=${lineVals.price_unit}`);
        }

        // ── Note lines (after product lines) ──
        const poValue = numeroPO ? String(numeroPO).trim() : "NC";
        const noteLines = [
          `Adresse de l'immeuble concerné : ${rue} ${numero}, ${codePostal} ${commune}`,
          `Nom du locataire : ${locatairePrenom} ${locataireNom}`,
          `Numéro du bon de commande : ${poValue}`,
        ];
        if (dateDebut) {
          noteLines.push(
            dateFin
              ? `Date souhaitée : du ${dateDebut} au ${dateFin}`
              : `Date souhaitée : à partir du ${dateDebut}`
          );
        }

        for (const noteName of noteLines) {
          const noteLineId = await odooCreate("sale.order.line", {
            order_id: orderId,
            name: noteName,
            display_type: "line_note",
            product_uom_qty: 0,
            price_unit: 0,
          });
          console.log(`  Note line created: id=${noteLineId} name="${noteName.substring(0, 60)}"`);
        }
    } else if (templateId) {
      // ── Template-based lines (fallback) ──
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
            lineVals.display_type = displayType;
          } else {
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
            const newName = `Adresse de l'immeuble concerné : ${adresseComplete}`;
            await odooExecute("sale.order.line", "write", [[line.id], { name: newName }]);
            console.log(`=== [Step 10] Line ${line.id}: address updated ===`);
          }

          if (name.includes("Nom du locataire")) {
            const newName = `Nom du locataire : ${locatairePrenom} ${locataireNom}`;
            await odooExecute("sale.order.line", "write", [[line.id], { name: newName }]);
            console.log(`=== [Step 10] Line ${line.id}: locataire updated ===`);
          }

          if (name.includes("bon de commande") && name.includes("NC")) {
            const poVal = numeroPO ? String(numeroPO).trim() : "NC";
            const newName = `Numéro du bon de commande : ${poVal}`;
            await odooExecute("sale.order.line", "write", [[line.id], { name: newName }]);
            console.log(`=== [Step 10] Line ${line.id}: PO number updated ===`);
          }
        }
    }

    // ══════════════════════════════════════════════
    // Step 10b: Force address AFTER all lines are created
    // ══════════════════════════════════════════════
    try {
      const finalBailleurId = bailleurPartnerId || partnerId;
      console.log('[DEBUG] bailleurPartnerId:', bailleurPartnerId, '→ finalBailleurId:', finalBailleurId);
      const writeResult = await odooExecute("sale.order", "write", [[orderId], {
        partner_shipping_id: adressePartnerId,
        x_studio_adresse_de_mission: adressePartnerId,
        x_studio_partie_1_bailleurs_: [[6, 0, [finalBailleurId]]],
        x_studio_partie_2_locataires_: [[6, 0, [locatairePartnerId]]],
      }]);
      console.log(`=== [Step 10b] Fields forced after lines: order=${orderId} partner_shipping_id=${adressePartnerId} x_studio_adresse_de_mission=${adressePartnerId} bailleur=${finalBailleurId} locataire=${locatairePartnerId} result=${JSON.stringify(writeResult)} ===`);
    } catch (writeErr) {
      console.error(`=== [Step 10b] Address write failed:`, writeErr);
    }

    // ══════════════════════════════════════════════
    // Step 10c: Add new address / notes / compteurs as note lines
    // ══════════════════════════════════════════════
    try {
      if (locataireNewRue) {
        const newAddr = `Nouvelle adresse du locataire : ${locataireNewRue} ${locataireNewNumero || ""} ${locataireNewBoite || ""}, ${locataireNewCodePostal || ""} ${locataireNewCommune || ""}`.replace(/\s+/g, " ").trim();
        await odooCreate("sale.order.line", {
          order_id: orderId,
          name: newAddr,
          display_type: "line_note",
          product_uom_qty: 0,
          price_unit: 0,
        });
        console.log(`=== [Step 10c] New address note line added ===`);

        // Create delivery address partner linked to locataire
        try {
          const newAddrStreet = `${locataireNewRue}, ${locataireNewNumero || ""}${locataireNewBoite ? `, ${locataireNewBoite}` : ""}`.trim();
          const newAddrFull = `${locataireNewRue} ${locataireNewNumero || ""}, ${locataireNewCodePostal || ""} ${locataireNewCommune || ""}`.replace(/\s+/g, " ").trim();
          const deliveryPartnerId = await odooCreate("res.partner", {
            name: newAddrFull,
            street: newAddrStreet,
            zip: String(locataireNewCodePostal || ""),
            city: String(locataireNewCommune || ""),
            country_id: belgiumCountryId,
            type: "delivery",
            parent_id: locatairePartnerId,
          });
          console.log(`=== [Step 10c] Locataire delivery address CREATED: id=${deliveryPartnerId} parent=${locatairePartnerId} ===`);
        } catch (deliveryErr) {
          console.error(`=== [Step 10c] Failed to create locataire delivery address:`, deliveryErr);
        }
      }

      if (notesLibres) {
        try {
          await odooExecute("sale.order", "message_post", [[orderId]], {
            body: escapeHtml(String(notesLibres)),
            message_type: "comment",
            subtype_xmlid: "mail.mt_note",
          });
          console.log(`=== [Step 10c] Internal note (notesLibres) posted to chatter ===`);
        } catch (notePostErr) {
          console.error(`=== [Step 10c] Failed to post notesLibres:`, notePostErr);
        }
      }

      if (locataireDecede) {
        try {
          await odooExecute("sale.order", "message_post", [[orderId]], {
            body: "⚠️ Locataire décédé",
            message_type: "comment",
            subtype_xmlid: "mail.mt_note",
          });
          console.log(`=== [Step 10c] Locataire décédé note posted to chatter ===`);
        } catch (decedeErr) {
          console.error(`=== [Step 10c] Failed to post locataire décédé note:`, decedeErr);
        }
      }

      if (compteurEau || compteurGaz || compteurElec) {
        try {
          const compteurBody =
            "Numéros de compteurs :\n" +
            (compteurEau ? `- Eau : ${escapeHtml(String(compteurEau))}\n` : "") +
            (compteurGaz ? `- Gaz : ${escapeHtml(String(compteurGaz))}\n` : "") +
            (compteurElec ? `- Électricité : ${escapeHtml(String(compteurElec))}\n` : "");
          await odooExecute("sale.order", "message_post", [[orderId]], {
            body: compteurBody,
            message_type: "comment",
            subtype_xmlid: "mail.mt_note",
          });
          console.log(`=== [Step 10c] Compteurs posted to chatter ===`);
        } catch (compteurPostErr) {
          console.error(`=== [Step 10c] Failed to post compteurs:`, compteurPostErr);
        }
      }
    } catch (noteErr) {
      console.error("=== [Step 10c] Note lines failed (non-blocking):", noteErr);
    }

    // ══════════════════════════════════════════════
    // Step 11: Upload files to Storage + attach to Odoo
    // ══════════════════════════════════════════════
    const supabaseAdmin = createAdminClient();

    async function handleFile(fileData: { name: string; customName?: string; base64: string }) {
      try {
        const buffer = Buffer.from(fileData.base64, "base64");
        const fileName = fileData.name;
        const ext = fileName.split(".").pop()?.toLowerCase() || "pdf";
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
        const mimetype = mimeMap[ext] || "application/octet-stream";

        // Upload to Supabase Storage with custom name
        const storagePath = `${user!.id}/${fileName}`;
        const { error: uploadErr } = await supabaseAdmin.storage
          .from("rdv-documents")
          .upload(storagePath, buffer, { contentType: mimetype, upsert: true });

        if (uploadErr) {
          console.error(`=== [Step 11] Storage upload failed for "${fileName}":`, uploadErr.message);
        } else {
          console.log(`=== [Step 11] Stored: ${storagePath} ===`);
        }

        // Attach to Odoo — use customName for the attachment name
        const odooName = fileData.customName || fileName;
        const attachId = await odooCreate("ir.attachment", {
          name: odooName,
          datas: fileData.base64,
          res_model: "sale.order",
          res_id: ensureInt(orderId),
          mimetype,
          type: "binary",
        });
        console.log(`=== [Step 11] Odoo attachment "${odooName}": id=${attachId} ===`);
      } catch (attachErr) {
        console.error(`=== [Step 11] File "${fileData.name}" failed (non-blocking):`, attachErr);
      }
    }

    if (Array.isArray(documents)) {
      for (const doc of documents) {
        await handleFile(doc);
      }
    }

    // ══════════════════════════════════════════════
    // Step 12: Send emails
    // ══════════════════════════════════════════════
    const missionLabel = typeMission === "entree" ? "Entrée locative" : "Sortie locative";
    const safeBailleur = escapeHtml(bailleurFullName);
    const safeLocataire = escapeHtml(locataireFullName);
    const safeAdresse = escapeHtml(adresseComplete);
    const safeTypeBien = escapeHtml(typeBienOdoo);
    const safeDateDebut = escapeHtml(String(dateDebut || ""));
    const safeDateFin = escapeHtml(String(dateFin || ""));
    const emailHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #F5B800; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Axis Experts</h1>
          <p style="color: #ffffff; margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Nouvelle demande de rendez-vous</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Mission</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${escapeHtml(missionLabel)}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Bien</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${safeTypeBien}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Adresse</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${safeAdresse}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Bailleur</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${safeBailleur}</td></tr>
            <tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Locataire</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${safeLocataire}</td></tr>
            ${dateDebut && isValidDate(dateDebut) ? `<tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Date souhaitée</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">Du ${safeDateDebut} au ${dateFin && isValidDate(dateFin) ? safeDateFin : "..."}</td></tr>` : ""}
          </table>
        </div>
        <p style="color:#999;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
        Notre équipe se chargera de contacter le locataire pour confirmer la date du rendez-vous.
        Vous recevrez un email de confirmation dès que le rendez-vous sera planifié.<br><br>
        <em>Cet email est envoyé automatiquement depuis noreply@axis-experts.be — merci de ne pas y répondre.</em>
        </p>
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

    // ══════════════════════════════════════════════
    // Step 12b: Internal notification email (non-blocking)
    // ══════════════════════════════════════════════
    try {
      // Fetch tarification from Odoo order
      let montantHTVA = "–";
      let montantTVA = "–";
      let montantTVAC = "–";
      try {
        const orderData = await odooExecute("sale.order", "search_read", [
          [["id", "=", orderId]],
        ], { fields: ["amount_untaxed", "amount_tax", "amount_total"], limit: 1 }) as Record<string, unknown>[];
        if (orderData.length > 0) {
          const htva = Number(orderData[0].amount_untaxed) || 0;
          const tax = Number(orderData[0].amount_tax) || 0;
          const ttc = Number(orderData[0].amount_total) || 0;
          montantHTVA = `${htva.toFixed(2)} €`;
          montantTVA = `${tax.toFixed(2)} €`;
          montantTVAC = `${ttc.toFixed(2)} €`;
        }
      } catch (amountErr) {
        console.error("=== [Step 12b] Failed to fetch order amounts:", amountErr);
      }

      const productLabel = selectedProduct?.displayLabel || selectedProduct?.odooName || typeBienOdoo;
      const safeProductLabel = escapeHtml(String(productLabel));
      const safeNumeroPO = escapeHtml(String(numeroPO || "–"));
      const safeNotes = escapeHtml(String(notesLibres || "–"));
      const safeCompteurEau = escapeHtml(String(compteurEau || "–"));
      const safeCompteurGaz = escapeHtml(String(compteurGaz || "–"));
      const safeCompteurElec = escapeHtml(String(compteurElec || "–"));

      const representantFullName = representantEnabled
        ? `${representantPrenom || ""} ${representantNom || ""}`.trim()
        : "";

      const uploadedFileNames = Array.isArray(documents)
        ? documents.map((d: { name: string; customName?: string }) => d.customName || d.name)
        : [];

      const tdLabel = `padding: 8px 0; color: #737373; font-size: 13px; vertical-align: top; width: 160px;`;
      const tdValue = `padding: 8px 0; font-weight: 600; color: #333333; font-size: 13px;`;
      const sectionTitle = (title: string) =>
        `<tr><td colspan="2" style="padding: 16px 0 6px; font-size: 13px; font-weight: 700; color: #F5B800; text-transform: uppercase; border-bottom: 1px solid #f0f0f0;">${title}</td></tr>`;

      const internalHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #F5B800; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Axis Experts — Notification interne</h1>
          <p style="color: #ffffff; margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Nouvelle demande de rendez-vous</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">

            ${sectionTitle("Mission")}
            <tr><td style="${tdLabel}">Type</td><td style="${tdValue}">${escapeHtml(missionLabel)}</td></tr>
            <tr><td style="${tdLabel}">Produit</td><td style="${tdValue}">${safeProductLabel}</td></tr>
            <tr><td style="${tdLabel}">Adresse</td><td style="${tdValue}">${safeAdresse}</td></tr>
            ${dateDebut ? `<tr><td style="${tdLabel}">Dates souhaitées</td><td style="${tdValue}">Du ${safeDateDebut} au ${dateFin && isValidDate(dateFin) ? safeDateFin : "..."}</td></tr>` : ""}

            ${sectionTitle("Tarification")}
            <tr><td style="${tdLabel}">Montant HTVA</td><td style="${tdValue}">${montantHTVA}</td></tr>
            <tr><td style="${tdLabel}">TVA (21%)</td><td style="${tdValue}">${montantTVA}</td></tr>
            <tr><td style="${tdLabel}">Total TVAC</td><td style="${tdValue}">${montantTVAC}</td></tr>

            ${sectionTitle("Bailleur")}
            <tr><td style="${tdLabel}">Nom</td><td style="${tdValue}">${safeBailleur}</td></tr>
            <tr><td style="${tdLabel}">Email</td><td style="${tdValue}">${escapeHtml(String(bailleurEmail || "–"))}</td></tr>
            <tr><td style="${tdLabel}">Téléphone</td><td style="${tdValue}">${escapeHtml(String(bailleurTelephone || "–"))}</td></tr>

            ${sectionTitle("Locataire")}
            <tr><td style="${tdLabel}">Nom</td><td style="${tdValue}">${safeLocataire}</td></tr>
            <tr><td style="${tdLabel}">Email</td><td style="${tdValue}">${escapeHtml(String(locataireEmail || "–"))}</td></tr>
            <tr><td style="${tdLabel}">Téléphone</td><td style="${tdValue}">${escapeHtml(String(locataireTelephone || "–"))}</td></tr>

            ${representantPartnerId ? `
            ${sectionTitle("Représentant")}
            <tr><td style="${tdLabel}">Nom</td><td style="${tdValue}">${escapeHtml(representantFullName)}</td></tr>
            <tr><td style="${tdLabel}">Rôle</td><td style="${tdValue}">${escapeHtml(String(representantRole || "–"))}</td></tr>
            <tr><td style="${tdLabel}">Email</td><td style="${tdValue}">${escapeHtml(String(representantEmail || "–"))}</td></tr>
            <tr><td style="${tdLabel}">Téléphone</td><td style="${tdValue}">${escapeHtml(String(representantTelephone || "–"))}</td></tr>
            ` : ""}

            ${uploadedFileNames.length > 0 ? `
            ${sectionTitle("Documents")}
            <tr><td colspan="2" style="padding: 8px 0; color: #333; font-size: 13px;">
              ${uploadedFileNames.map((n: string) => `• ${escapeHtml(n)}`).join("<br>")}
            </td></tr>
            ` : ""}

            ${sectionTitle("Informations complémentaires")}
            <tr><td style="${tdLabel}">N° bon de commande</td><td style="${tdValue}">${safeNumeroPO}</td></tr>
            <tr><td style="${tdLabel}">Notes</td><td style="${tdValue}">${safeNotes}</td></tr>
            <tr><td style="${tdLabel}">Compteur eau</td><td style="${tdValue}">${safeCompteurEau}</td></tr>
            <tr><td style="${tdLabel}">Compteur gaz</td><td style="${tdValue}">${safeCompteurGaz}</td></tr>
            <tr><td style="${tdLabel}">Compteur électricité</td><td style="${tdValue}">${safeCompteurElec}</td></tr>

          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://axisexperts.odoo.com/odoo/sales/${orderId}" style="display: inline-block; background: #F5B800; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Voir le devis dans Odoo</a>
          </div>
        </div>
        <p style="color:#999;font-size:11px;margin-top:16px;text-align:center;">
          <em>Email interne généré automatiquement — ne pas répondre.</em>
        </p>
      </div>
      `;

      await resend.emails.send({
        from: "Axis Experts <noreply@axis-experts.be>",
        to: "info@axis-experts.be",
        subject: `Nouvelle demande RDV – ${escapeHtml(missionLabel)} – ${rue} ${numero}, ${codePostal} ${commune}`,
        html: internalHtml,
      });
      console.log(`=== [Step 12b] Internal email sent to info@axis-experts.be ===`);
    } catch (internalEmailErr) {
      console.error("=== [Step 12b] Internal notification email failed (non-blocking):", internalEmailErr);
    }

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error("submit-rdv error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
