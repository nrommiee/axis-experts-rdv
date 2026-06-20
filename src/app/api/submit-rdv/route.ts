import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { odooCreate, odooExecute, odooSearch, getTemplateId } from "@/lib/odoo";
import { TYPE_BIEN_ODOO_MAP, getTypeBienFromDefaultCode } from "@/lib/types";
import {
  formatRdvDateRangeFr,
  rdvDateRangeSchema,
} from "@/lib/validation/rdvDateSchema";
import { sendEmail } from "@/lib/email";
import { validateMagicBytes } from "@/lib/mime-validation";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit/log-action";
import { formatDeliveryPartnerName } from "@/lib/format-delivery-partner-name";
import { isTenantNameRequired } from "@/lib/tenant-name";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_DOCUMENTS = 10;
// Aligné sur le parcours public (src/lib/public-rdv/uploads.ts) : 10 Mo / fichier.
// Les fichiers sont uploadés en DIRECT vers Storage par le navigateur ; seuls les
// CHEMINS transitent par cette route, le plafond proxy (25mb) ne s'applique donc plus.
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const TOTAL_DOCUMENTS_BUDGET = 30 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
] as const;

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

type ValidationFailure = {
  error: string;
  code?: "RDV_DATE_RANGE_INVALID";
  issues?: unknown;
};

function validateBody(data: Record<string, unknown>): ValidationFailure | null {
  const s = (key: string) => typeof data[key] === "string" ? (data[key] as string).trim() : "";

  if (!["entree", "sortie"].includes(s("typeMission"))) return { error: "typeMission invalide (entree ou sortie attendu)" };
  if (!s("rue")) return { error: "Champ rue requis" };
  if (!s("numero")) return { error: "Champ numéro requis" };
  if (!/^\d{4}$/.test(s("codePostal"))) return { error: "Code postal invalide (4 chiffres attendus)" };
  if (!s("commune")) return { error: "Champ commune requis" };
  // Validation locataire nom/prénom déplacée APRÈS le chargement du portal_client
  // car elle dépend du flag require_tenant_name (obligatoire vs optionnel).

  if (!s("bailleurNom")) return { error: "Nom du bailleur requis" };

  const bailleurEmail = s("bailleurEmail");
  if (bailleurEmail && !isValidEmail(bailleurEmail)) return { error: "Email bailleur invalide" };

  const locataireEmail = s("locataireEmail");
  if (locataireEmail && !isValidEmail(locataireEmail)) return { error: "Email locataire invalide" };

  if (data.representantEnabled) {
    if (!s("representantNom")) return { error: "Nom du représentant requis" };
    const repEmail = s("representantEmail");
    if (repEmail && !isValidEmail(repEmail)) return { error: "Email du représentant invalide" };
  }

  const dateDebut = s("dateDebut");
  const dateFin = s("dateFin");
  const parsed = rdvDateRangeSchema.safeParse({ dateDebut, dateFin });
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message ?? "Disponibilités invalides.";
    return {
      error: firstMsg,
      code: "RDV_DATE_RANGE_INVALID",
      issues: parsed.error.issues,
    };
  }

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

    const rl = await checkRateLimit({
      userId: user.id,
      endpoint: "submit-rdv",
      limit: 10,
      windowMinutes: 60,
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes, réessayez plus tard" },
        { status: 429 }
      );
    }

    const data = await request.json();
    const {
      typeMission, typeBien, rue, numero, boite, codePostal, commune,
      dateDebut, dateFin,
      bailleurSociete, bailleurNom, bailleurPrenom, bailleurEmail, bailleurTelephone,
      locataireNom, locatairePrenom, locataireEmail, locataireTelephone,
      locataireNewRue, locataireNewNumero, locataireNewBoite,
      locataireNewCodePostal, locataireNewCommune,
      representantEnabled, representantPrenom, representantNom,
      representantRole, representantEmail, representantTelephone,
      locataireDecede, numeroPO,
      notesLibres, compteurEau, compteurGaz, compteurElec,
      documents,
      agencyPriceSelection,
      notifyBailleur,
    } = data;
    // selectedProduct / selectedOptions may be overridden for agencies
    // from agencyPriceSelection after the portal client is loaded.
    let selectedProduct = data.selectedProduct;
    let selectedOptions = data.selectedOptions;

    // ── Validation ──
    const validationError = validateBody(data);
    if (validationError) {
      const body: Record<string, unknown> = { error: validationError.error };
      if (validationError.code) body.code = validationError.code;
      if (validationError.issues) body.issues = validationError.issues;
      return NextResponse.json(body, { status: 400 });
    }

    // ── Documents validation (count / type / size / chemin) ──
    // Les fichiers sont déjà dans Storage (upload direct navigateur). On ne reçoit
    // plus de base64 mais des CHEMINS + métadonnées. Le contrôle magic bytes se fait
    // au moment de l'attachement (Step 11) sur le contenu réellement téléchargé.
    if (Array.isArray(documents)) {
      if (documents.length > MAX_DOCUMENTS) {
        return NextResponse.json(
          { error: `Trop de documents (max ${MAX_DOCUMENTS})` },
          { status: 400 }
        );
      }
      let totalBytes = 0;
      for (const doc of documents as Array<{ name?: unknown; path?: unknown; size?: unknown }>) {
        if (
          !doc ||
          typeof doc.name !== "string" ||
          typeof doc.path !== "string"
        ) {
          return NextResponse.json(
            { error: "Document invalide" },
            { status: 400 }
          );
        }
        // Garde-fou: un client authentifié ne peut attacher que SES propres fichiers.
        if (!doc.path.startsWith(`${user.id}/`)) {
          return NextResponse.json(
            { error: `Chemin de fichier non autorisé: ${doc.name}` },
            { status: 400 }
          );
        }
        const ext = doc.name.split(".").pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
          return NextResponse.json(
            { error: `Type de fichier non autorisé: ${doc.name}` },
            { status: 400 }
          );
        }
        const sizeBytes = typeof doc.size === "number" ? doc.size : 0;
        if (sizeBytes > MAX_DOCUMENT_BYTES) {
          return NextResponse.json(
            {
              error: `${doc.name} dépasse ${
                MAX_DOCUMENT_BYTES / 1024 / 1024
              } MB`,
            },
            { status: 400 }
          );
        }
        totalBytes += sizeBytes;
        if (totalBytes > TOTAL_DOCUMENTS_BUDGET) {
          const totalMb = (totalBytes / 1024 / 1024).toFixed(1);
          const maxMb = TOTAL_DOCUMENTS_BUDGET / 1024 / 1024;
          return NextResponse.json(
            {
              error: `Taille maximale autorisée : ${maxMb} MB cumulés. Votre upload fait ${totalMb} MB. Veuillez réduire le nombre ou la taille des fichiers.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const rdvDateLabel = formatRdvDateRangeFr({ dateDebut, dateFin });
    console.log(`[submit-rdv] dateDebut=${dateDebut} dateFin=${dateFin} label="${rdvDateLabel}"`);

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

    // Flag org : nom/prénom du locataire obligatoire (défaut) ou optionnel.
    const requireTenant = isTenantNameRequired(clientRow.require_tenant_name);
    if (requireTenant) {
      const locNom = typeof locataireNom === "string" ? locataireNom.trim() : "";
      const locPrenom =
        typeof locatairePrenom === "string" ? locatairePrenom.trim() : "";
      if (!locNom) {
        return NextResponse.json(
          { error: "Nom du locataire requis" },
          { status: 400 }
        );
      }
      if (!locPrenom) {
        return NextResponse.json(
          { error: "Prénom du locataire requis" },
          { status: 400 }
        );
      }
    }

    // ══════════════════════════════════════════════
    // Step 1b: Agency price resolution
    // ══════════════════════════════════════════════
    // For agency clients, the product/options come from the simulator's
    // PriceSelection (sent as agencyPriceSelection), not from the form picker.
    // We resolve the base product and the supplements to synthesize a
    // selectedProduct/selectedOptions compatible with the product-lines branch.
    if (clientRow.client_type === "agency") {
      if (!agencyPriceSelection || typeof agencyPriceSelection !== "object") {
        return NextResponse.json(
          { error: "Simulation d'honoraires requise" },
          { status: 400 }
        );
      }
      const aps = agencyPriceSelection as {
        basePrice?: unknown;
        supplements?: unknown;
        odooCode?: unknown;
        extraRooms?: unknown;
      };
      const odooCode = typeof aps.odooCode === "string" ? aps.odooCode : "";
      if (!odooCode) {
        return NextResponse.json(
          { error: "Code produit manquant dans la simulation d'honoraires" },
          { status: 400 }
        );
      }

      // Resolve base product.template by default_code
      const baseProducts = (await odooExecute(
        "product.template",
        "search_read",
        [[
          ["default_code", "=", odooCode],
          ["active", "=", true],
        ]],
        { fields: ["id", "name", "default_code", "list_price"], limit: 1 }
      )) as Array<{ id: number; name: string; default_code: string; list_price: number }>;

      if (baseProducts.length === 0) {
        return NextResponse.json(
          { error: `Produit introuvable pour le code ${odooCode}` },
          { status: 400 }
        );
      }

      const baseProduct = baseProducts[0];
      const basePrice = typeof aps.basePrice === "number" ? aps.basePrice : Number(baseProduct.list_price) || 0;
      const extraRooms = typeof aps.extraRooms === "number" ? aps.extraRooms : 0;
      selectedProduct = {
        id: baseProduct.id,
        odooName: baseProduct.name,
        defaultCode: baseProduct.default_code,
        displayLabel: baseProduct.name,
        listPrice: basePrice + extraRooms * 15,
      };

      // Resolve supplements → product_catalog → product.template
      const supplementIds = Array.isArray(aps.supplements)
        ? (aps.supplements as unknown[]).filter((s): s is string => typeof s === "string" && s.length > 0)
        : [];

      if (supplementIds.length > 0) {
        const admin = createAdminClient();
        const { data: catalogRows, error: catalogError } = await admin
          .from("product_catalog")
          .select("code, odoo_default_code, label")
          .in("code", supplementIds);

        if (catalogError) {
          console.error("[Step 1b] product_catalog lookup failed:", catalogError);
        }

        type CatalogRow = { code: string; odoo_default_code: string; label: string };
        const rows = (catalogRows ?? []) as CatalogRow[];
        const suppDefaultCodes = rows
          .map((r) => r.odoo_default_code)
          .filter((c): c is string => typeof c === "string" && c.length > 0);

        if (suppDefaultCodes.length > 0) {
          const suppProducts = (await odooExecute(
            "product.template",
            "search_read",
            [[
              ["default_code", "in", suppDefaultCodes],
              ["active", "=", true],
            ]],
            { fields: ["id", "name", "default_code", "list_price"] }
          )) as Array<{ id: number; name: string; default_code: string; list_price: number }>;

          selectedOptions = suppProducts.map((p) => ({
            id: p.id,
            odooName: p.name,
            defaultCode: p.default_code,
            displayLabel: p.name,
            listPrice: Number(p.list_price) || 0,
          }));
        } else {
          selectedOptions = [];
        }
      } else {
        selectedOptions = [];
      }

      console.log(
        `=== [Step 1b] Agency product synthesized: base=${(selectedProduct as { defaultCode: string }).defaultCode} options=${(selectedOptions as unknown[]).length} ===`
      );
    }

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
    // Titre (name) de l'adresse de livraison : format "CP VILLE, RUE, NUMERO, BOÎTE".
    // adresseComplete reste INCHANGÉ (notes/emails).
    const adresseName = formatDeliveryPartnerName({
      rue,
      numero,
      boite,
      codePostal,
      ville: commune,
    });

    const adressePartnerRaw = await odooCreate("res.partner", {
      name: adresseName,
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
    // - Agencies: find/create the actual property owner from body fields
    //   (same search-by-email-then-by-name pattern as the locataire).
    //   The agent's portal partner stays only in x_studio_agence_partenaire.
    // - Other clients: the bailleur IS the portal client, so reuse
    //   clientRow.odoo_partner_id (historical behavior).
    // ══════════════════════════════════════════════
    const bailleurFullName = bailleurPrenom
      ? `${bailleurPrenom} ${bailleurNom}`.trim()
      : String(bailleurNom || "").trim();

    let bailleurPartnerId: number;
    if (clientRow.client_type === "agency") {
      const ownerName = String(bailleurSociete || "").trim() || bailleurFullName;
      if (bailleurEmail) {
        const byEmail = await odooSearch(
          "res.partner",
          [["email", "=", bailleurEmail]],
          ["id", "name"],
          1
        );
        if (byEmail.length > 0) {
          bailleurPartnerId = ensureInt(byEmail[0].id);
          const updateVals: Record<string, unknown> = {};
          if (bailleurTelephone) updateVals.phone = bailleurTelephone;
          if (Object.keys(updateVals).length > 0) {
            await odooExecute("res.partner", "write", [[bailleurPartnerId], updateVals]);
          }
          console.log(
            `=== [Step 4] Owner FOUND by email: id=${bailleurPartnerId} (agency) ===`
          );
        } else {
          bailleurPartnerId = ensureInt(
            await odooCreate("res.partner", {
              name: ownerName,
              email: bailleurEmail,
              phone: bailleurTelephone || false,
            })
          );
          console.log(
            `=== [Step 4] Owner CREATED: id=${bailleurPartnerId} (agency) ===`
          );
        }
      } else {
        const byName = await odooSearch(
          "res.partner",
          [["name", "=", ownerName]],
          ["id"],
          1
        );
        if (byName.length > 0) {
          bailleurPartnerId = ensureInt(byName[0].id);
          if (bailleurTelephone) {
            await odooExecute("res.partner", "write", [
              [bailleurPartnerId],
              { phone: bailleurTelephone },
            ]);
          }
          console.log(
            `=== [Step 4] Owner FOUND by name: id=${bailleurPartnerId} (agency) ===`
          );
        } else {
          bailleurPartnerId = ensureInt(
            await odooCreate("res.partner", {
              name: ownerName,
              phone: bailleurTelephone || false,
            })
          );
          console.log(
            `=== [Step 4] Owner CREATED: id=${bailleurPartnerId} (agency, no email) ===`
          );
        }
      }
    } else {
      bailleurPartnerId = ensureInt(clientRow.odoo_partner_id);
      console.log(
        `=== [Step 4] Bailleur partner: using clientRow.odoo_partner_id=${bailleurPartnerId} ===`
      );
    }

    // ══════════════════════════════════════════════
    // Step 5: Locataire partner (search by email, update if found)
    // ══════════════════════════════════════════════
    const locataireFullName = `${locatairePrenom} ${locataireNom}`.trim();
    // Flag org optionnel : si aucun nom de locataire fourni, on NE crée JAMAIS de
    // res.partner locataire vide (cf. odoo-order.ts findOrCreatePartyPartner :
    // `if (!nom) return null`). locatairePartnerId reste null et les champs Odoo
    // associés sont omis plus bas.
    let locatairePartnerId: number | null = null;

    if (locataireFullName) {
      if (locataireEmail) {
        const byEmail = await odooSearch("res.partner", [["email", "=", locataireEmail]], ["id", "name"], 1);
        if (byEmail.length > 0) {
          locatairePartnerId = ensureInt(byEmail[0].id);
          const existingName = String(byEmail[0].name || "");
          // Don't overwrite existing name — only update phone if provided
          if (existingName && existingName !== locataireFullName) {
            console.warn(
              `=== [Step 5] Locataire name mismatch: existing_name_length=${existingName.length} incoming_name_length=${locataireFullName.length} — keeping existing ===`
            );
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
    } else {
      console.log(`=== [Step 5] Locataire SKIPPED: no name (require_tenant_name=false) — pas de res.partner créé ===`);
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
    // Step 8: Create sale.order
    // ══════════════════════════════════════════════
    // Verify all IDs are valid integers before building payload
    console.log(`=== [Step 8] ID check: adresse=${adressePartnerId} bailleur=${bailleurPartnerId} locataire=${locatairePartnerId} partner=${partnerId} ===`);

    // For agencies, sale.order.partner_id must point to the actual owner
    // (same partner as x_studio_partie_1_bailleurs_), not the agent. The
    // agent's portal partner stays in x_studio_agence_partenaire only.
    const orderPartnerId = clientRow.client_type === "agency" ? bailleurPartnerId : partnerId;

    const orderValues: Record<string, unknown> = {
      partner_id: orderPartnerId,
      partner_shipping_id: adressePartnerId,
      x_studio_adresse_de_mission: adressePartnerId,
      x_studio_type_de_bien_1: typeBienOdoo,
      x_studio_type_de_client: clientRow.client_type === "agency" ? "Agent immobilier" : "Bailleur",
      ...(clientRow.client_type === "agency" && {
        x_studio_agence_partenaire: ensureInt(clientRow.odoo_partner_id),
      }),
      x_studio_partie_1_bailleurs_: bailleurPartnerId,
      // Omis si aucun locataire (flag optionnel + nom vide) : pas de fiche fantôme.
      ...(locatairePartnerId
        ? { x_studio_partie_2_locataires_: locatairePartnerId }
        : {}),
      x_studio_portail_client: true,
    };

    if (templateId) {
      orderValues.sale_order_template_id = ensureInt(templateId);
    }
    if (tagIds) {
      orderValues.tag_ids = tagIds;
    }
    if (representantPartnerId) {
      orderValues.x_studio_conseil_intervenant_2_ = representantPartnerId;
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
      await odooExecute("sale.order", "write", [[orderId], { x_studio_suivi_expert: "En cours", x_studio_portail_client: true }]);
      console.log(`=== [Step 8b] x_studio_suivi_expert set to "En cours" for order ${orderId} ===`);
    } catch (statusErr) {
      console.error(`=== [Step 8b] Failed to set suivi_expert:`, statusErr);
    }

    // ══════════════════════════════════════════════
    // Step 9: Create order lines
    // ══════════════════════════════════════════════
    if (!useProductLines && !templateId) {
      console.error(`=== [Step 9] No product configured: useProductLines=${useProductLines} templateId=${templateId} — cancelling order ${orderId} ===`);
      try {
        await odooExecute("sale.order", "action_cancel", [[orderId]]);
        console.log(`=== [Step 9] Order ${orderId} cancelled ===`);
      } catch (cancelErr) {
        console.error(`=== [Step 9] Failed to cancel order ${orderId}:`, cancelErr);
      }
      return NextResponse.json(
        { error: "Aucun produit configuré pour ce client" },
        { status: 400 }
      );
    }

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
          const nameLength = String(item.odooName || "").length;
          console.log(
            `  Creating sale.order.line: order_id=${orderId} product_id=${productProductId} (tmpl=${productTmplId}) price=${lineVals.price_unit} name_length=${nameLength}`
          );
          const lineId = await odooCreate("sale.order.line", lineVals);
          console.log(
            `  Line created: id=${lineId} product_id=${productProductId} (tmpl=${productTmplId}) name_length=${nameLength} price=${lineVals.price_unit}`
          );
        }

        // ── Note lines (after product lines) ──
        const poValue = numeroPO ? String(numeroPO).trim() : "NC";
        const noteLines = [
          `Adresse de l'immeuble concerné : ${rue} ${numero}, ${codePostal} ${commune}`,
          // Note locataire omise si aucun nom (flag optionnel).
          ...(locataireFullName
            ? [`Nom du locataire : ${locatairePrenom} ${locataireNom}`]
            : []),
          `Numéro du bon de commande : ${poValue}`,
        ];
        if (rdvDateLabel) {
          noteLines.push(`Date souhaitée : ${rdvDateLabel}`);
        }

        for (const noteName of noteLines) {
          const noteLineId = await odooCreate("sale.order.line", {
            order_id: orderId,
            name: noteName,
            display_type: "line_note",
            product_uom_qty: 0,
            price_unit: 0,
          });
          console.log(
            `  Note line created: id=${noteLineId} note_length=${noteName.length}`
          );
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
          console.log(
            `  Line created: id=${lineId} display_type=${displayType || "product"} note_length=${String(tLine.name || "").length}`
          );
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

          if (name.includes("Nom du locataire") && locataireFullName) {
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
      console.log(`=== [Step 10b] PRE-WRITE: bailleurPartnerId=${bailleurPartnerId} → finalBailleurId=${finalBailleurId} ===`);
      console.log(`=== [Step 10b] PRE-WRITE: locatairePartnerId=${locatairePartnerId} ===`);
      const writeResult = await odooExecute("sale.order", "write", [[orderId], {
        partner_shipping_id: adressePartnerId,
        x_studio_adresse_de_mission: adressePartnerId,
        x_studio_partie_1_bailleurs_: finalBailleurId,
        // Omis si aucun locataire : on n'écrase pas avec une valeur vide.
        ...(locatairePartnerId
          ? { x_studio_partie_2_locataires_: locatairePartnerId }
          : {}),
      }]);
      console.log(`=== [Step 10b] Fields forced after lines: order=${orderId} bailleur=${finalBailleurId} locataire=${locatairePartnerId} result=${JSON.stringify(writeResult)} ===`);
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

        // Create delivery address partner linked to locataire.
        // Skip si pas de fiche locataire (flag optionnel + nom vide) : on ne crée
        // pas d'adresse orpheline rattachée à aucun partner.
        if (locatairePartnerId) try {
          const newAddrStreet = `${locataireNewRue}, ${locataireNewNumero || ""}${locataireNewBoite ? `, ${locataireNewBoite}` : ""}`.trim();
          // Titre (name) de l'adresse de livraison alternative locataire :
          // même format "CP VILLE, RUE, NUMERO, BOÎTE". La note d'adresse (newAddr, l.~839) reste inchangée.
          const newAddrName = formatDeliveryPartnerName({
            rue: locataireNewRue,
            numero: locataireNewNumero,
            boite: locataireNewBoite,
            codePostal: locataireNewCodePostal,
            ville: locataireNewCommune,
          });
          const deliveryPartnerId = await odooCreate("res.partner", {
            name: newAddrName,
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
    // Step 11: Download files from Storage + attach to Odoo
    // ══════════════════════════════════════════════
    // Les fichiers ont été uploadés en DIRECT vers Storage par le navigateur
    // (même mécanisme que saveDraft). On les RELIT par chemin pour créer
    // l'attachement Odoo (cf. src/lib/public-rdv/odoo-order.ts). Résilience par
    // fichier : un échec est loggué et n'interrompt pas les autres.
    const supabaseAdmin = createAdminClient();

    async function handleFile(fileData: { name: string; customName?: string; path: string }) {
      const ext = fileData.name.split(".").pop()?.toLowerCase() || "pdf";
      const mimeMap: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      const mimetype = mimeMap[ext] || "application/octet-stream";

      try {
        const { data: blob, error: dlError } = await supabaseAdmin.storage
          .from("rdv-documents")
          .download(fileData.path);
        if (dlError || !blob) {
          console.error(
            `=== [Step 11] Storage download failed: ext=${ext} path=${fileData.path} — ${dlError?.message ?? "no blob"}`
          );
          return;
        }

        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString("base64");
        const sizeKb = Math.ceil(buffer.byteLength / 1024);

        // Defense-in-depth : valide le contenu réel (magic bytes) côté serveur.
        if (!validateMagicBytes(fileData.name, base64)) {
          console.error(
            `=== [Step 11] Magic bytes invalid, skipped: ext=${ext} size_kb=${sizeKb} ===`
          );
          return;
        }

        // Attach to Odoo — use customName for the attachment name
        const odooName = fileData.customName || fileData.name;
        const attachId = await odooCreate("ir.attachment", {
          name: odooName,
          datas: base64,
          res_model: "sale.order",
          res_id: ensureInt(orderId),
          mimetype,
          type: "binary",
        });
        console.log(
          `=== [Step 11] Odoo attachment created: id=${attachId} ext=${ext} size_kb=${sizeKb} order=${orderId} ===`
        );

        // ── Option B : Supabase en simple TRANSIT ──
        // L'attachement Odoo est CONFIRMÉ (attachId) → on supprime le fichier de
        // Storage. Suppression UNIQUEMENT après confirmation (si l'attach échoue,
        // on throw avant et on ne supprime pas). Garde-fou path préfixé user id.
        // Échec de suppression = non-bloquant (un orphelin n'empêche pas le RDV).
        if (fileData.path.startsWith(`${user!.id}/`)) {
          try {
            const { error: removeErr } = await supabaseAdmin.storage
              .from("rdv-documents")
              .remove([fileData.path]);
            if (removeErr) {
              console.error(
                `=== [Step 11] Storage cleanup failed (non-blocking): path=${fileData.path} — ${removeErr.message}`
              );
            } else {
              console.log(
                `=== [Step 11] Storage cleanup OK (transit): path=${fileData.path} ===`
              );
            }
          } catch (removeThrow) {
            console.error(
              `=== [Step 11] Storage cleanup threw (non-blocking): path=${fileData.path}`,
              removeThrow
            );
          }
        }
      } catch (attachErr) {
        console.error(
          `=== [Step 11] File attach failed (non-blocking): ext=${ext}`,
          attachErr
        );
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
    const safeRdvDateLabel = escapeHtml(rdvDateLabel);
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
            ${rdvDateLabel ? `<tr><td style="padding: 8px 0; color: #737373; font-size: 14px;">Date souhaitée</td><td style="padding: 8px 0; font-weight: 600; color: #333333; font-size: 14px;">${safeRdvDateLabel}</td></tr>` : ""}
          </table>
        </div>
        <p style="color:#999;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">
        Notre équipe se chargera de contacter le locataire pour confirmer la date du rendez-vous.
        Vous recevrez un email de confirmation dès que le rendez-vous sera planifié.<br><br>
        <em>Cet email est envoyé automatiquement depuis noreply@axis-experts.be — merci de ne pas y répondre.</em>
        </p>
      </div>
    `;

    const emailRecipients: string[] = [];
    const shouldNotifyBailleur = notifyBailleur !== false;
    if (bailleurEmail && shouldNotifyBailleur) emailRecipients.push(bailleurEmail);

    if (emailRecipients.length > 0) {
      try {
        const bailleurEmailResult = await sendEmail({
          to: emailRecipients,
          subject: `Nouvelle demande EDL - ${missionLabel} - ${adresseComplete}`,
          html: emailHtml,
          tags: [
            { name: "route", value: "submit-rdv" },
            { name: "env", value: process.env.NODE_ENV ?? "unknown" },
          ],
        });
        if (bailleurEmailResult.success) {
          console.log(
            `=== [Step 12] Email sent: recipients_count=${emailRecipients.length} ===`
          );
        } else {
          console.error(`=== [Step 12] Email send failed (non-blocking): ${bailleurEmailResult.error} ===`);
        }
      } catch (bailleurEmailErr) {
        console.error("=== [Step 12] Email send threw (non-blocking):", bailleurEmailErr);
      }
    } else {
      console.log(
        `=== [Step 12] Email client skipped: ${shouldNotifyBailleur ? "no bailleur email" : "notifyBailleur=false"} ===`
      );
    }

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
            ${rdvDateLabel ? `<tr><td style="${tdLabel}">Date souhaitée</td><td style="${tdValue}">${safeRdvDateLabel}</td></tr>` : ""}

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

      await sendEmail({
        to: "info@axis-experts.be",
        subject: `Nouvelle demande RDV – ${escapeHtml(missionLabel)} – ${rue} ${numero}, ${codePostal} ${commune}`,
        html: internalHtml,
        tags: [
          { name: "route", value: "submit-rdv" },
          { name: "env", value: process.env.NODE_ENV ?? "unknown" },
        ],
      });
      console.log(`=== [Step 12b] Internal email sent to info@axis-experts.be ===`);
    } catch (internalEmailErr) {
      console.error("=== [Step 12b] Internal notification email failed (non-blocking):", internalEmailErr);
    }

    // Fetch order name (e.g. "S00123") so the client can use it as a stable
    // reference for things like /api/rdv-custom-values. Non-blocking.
    let orderName: string | null = null;
    try {
      const orderNameRes = (await odooExecute(
        "sale.order",
        "search_read",
        [[["id", "=", orderId]]],
        { fields: ["name"], limit: 1 }
      )) as { name?: string }[];
      if (orderNameRes.length > 0 && typeof orderNameRes[0].name === "string") {
        orderName = orderNameRes[0].name;
      }
    } catch (nameErr) {
      console.error("=== [Step 13] Failed to fetch order name (non-blocking):", nameErr);
    }

    // Track submission for notifications creator_only mode (non-blocking)
    try {
      if (!clientRow.organization_id) {
        console.warn(
          `=== [Step 14] Submission tracking skipped: no organization_id on portal_client (user=${user.id}) ===`
        );
      } else {
        const submissionAdmin = createAdminClient();
        const { error: trackError } = await submissionAdmin
          .from("portal_submissions")
          .insert({
            odoo_order_id: orderId,
            odoo_order_name: orderName,
            user_id: user.id,
            organization_id: clientRow.organization_id,
          });
        if (trackError) {
          console.error("[submit-rdv] Failed to track submission:", trackError);
        }
      }
    } catch (trackErr) {
      console.error("[submit-rdv] Failed to track submission (exception):", trackErr);
      // ne pas bloquer la réponse — la commande Odoo est déjà créée
    }

    await logAction({
      userId: user.id,
      organizationId: clientRow.organization_id ?? undefined,
      action: "rdv.create",
      resourceType: "rdv",
      resourceId: String(orderId),
      metadata: {
        type_mission: typeMission,
        type_bien: typeBienOdoo,
        order_name: orderName,
        documents_count: Array.isArray(documents) ? documents.length : 0,
      },
    });

    return NextResponse.json({ success: true, orderId, orderName });
  } catch (err) {
    console.error("submit-rdv error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
