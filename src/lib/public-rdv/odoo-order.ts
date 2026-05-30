// Création du devis Odoo (sale.order) à la confirmation d'une demande publique.
// UTILISE odoo.ts (odooCreate/odooSearch/odooExecute) sans le modifier.
//
// Règles critiques :
//  - Devis en BROUILLON uniquement (jamais action_confirm).
//  - JAMAIS de write sur un contact res.partner existant (lecture seule).
//  - price_unit pris depuis Odoo (list_price), jamais depuis le client.
//  - Garde-fou agence : agCode doit être un ID res.partner existant, sinon
//    on crée un nouveau contact (pas de rattachement au hasard).
//  - Anti-doublon : si odoo_order_id déjà rempli, on ne recrée pas.

import { odooCreate, odooSearch, odooExecute } from "@/lib/odoo";
import { createAdminClient } from "@/lib/supabase/admin";
import { optionRef } from "@/lib/public-rdv/pricing";

type FormData = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function ensureInt(v: unknown): number {
  if (Array.isArray(v)) return Number(v[0]);
  return Number(v);
}

// Libellés de section selon la mission (texte exact fourni par le métier).
const SECTION_ENTREE =
  "État des Lieux ENTRÉE LOCATIVE : Gestion rendez-vous, un déplacement, conseils & recommandations sur les lieux, constats, relevés clés, compteurs accessibles et documents présentés, rapport de Procès-verbal au format PDF";
const SECTION_SORTIE =
  "ÉTAT DES LIEUX DE SORTIE LOCATIVE : Gestion rendez-vous, déplacement, Visite et examen de sortie locative immeuble, Récolement, Détermination et valorisations des dégâts locatifs, Relevés compteurs identifiés et accessibles (pas transferts) / Clés & Attestations présentées, Procès-verbal d'indemnité de dégâts ou manquements locatifs, envoi rapport.";

const NOTE_PARTIES =
  "Montant pour chaque partie et tenant compte que nous intervenons pour le locataire et le bailleur";

const SUPP_KEYS = ["meuble", "jardin", "sanitaire", "garage"]; // cave = offert, pas de ligne

interface StoredDoc {
  path: string;
  name: string;
  size?: number;
  mime?: string;
}

interface RequestRow {
  id: string;
  odoo_order_id: number | null;
  form_data: FormData | null;
  documents: StoredDoc[] | null;
}

// Résout un default_code -> product.product (variante) + nom + prix HTVA Odoo.
async function resolveProduct(
  defaultCode: string
): Promise<{ productId: number; name: string; price: number } | null> {
  const tmpls = await odooSearch(
    "product.template",
    [
      ["default_code", "=", defaultCode],
      ["active", "=", true],
    ],
    ["id", "name", "list_price"],
    1
  );
  if (tmpls.length === 0) return null;
  const tmplId = ensureInt(tmpls[0].id);
  const name = str(tmpls[0].name);
  const price = Number(tmpls[0].list_price) || 0;

  // sale.order.line exige un product.product (variante). Si aucune variante
  // n'est trouvée, on renvoie null (log + skip côté appelant) : NE PAS retomber
  // sur l'ID de product.template, qui n'est PAS un product_id valide et ferait
  // planter odooCreate (et donc interromprait toutes les lignes suivantes).
  const variants = await odooSearch(
    "product.product",
    [["product_tmpl_id", "=", tmplId]],
    ["id"],
    1
  );
  if (variants.length === 0) return null;
  const productId = ensureInt(variants[0].id);
  return { productId, name, price };
}

// Dédoublonnage res.partner — lecture seule, jamais de write sur l'existant.
async function findOrCreatePartner(
  form: FormData,
  belgiumCountryId: number | null
): Promise<number> {
  const who = str(form.who);
  const ptype = str(form.ptype);
  const nom = str(form.nom);
  const email = str(form.email);
  const phone = str(form.phone);
  const vat = str(form.vat);
  const agCode = str(form.agCode);

  // Agence : agCode = ID de fiche res.partner. On vérifie qu'il existe.
  if (who === "agence") {
    const idNum = Number(agCode);
    if (agCode && Number.isInteger(idNum) && idNum > 0) {
      const found = await odooSearch(
        "res.partner",
        [["id", "=", idNum]],
        ["id"],
        1
      );
      if (found.length > 0) {
        return ensureInt(found[0].id);
      }
    }
    // Garde-fou : code invalide / introuvable -> nouveau contact, pas de
    // rattachement au hasard.
    return ensureInt(
      await odooCreate("res.partner", {
        name: nom || "Agence (demande publique)",
        email: email || false,
        phone: phone || false,
        is_company: true,
      })
    );
  }

  // Société : par TVA puis par email.
  if (ptype === "soc") {
    if (vat) {
      const byVat = await odooSearch(
        "res.partner",
        [["vat", "=", vat]],
        ["id"],
        1
      );
      if (byVat.length > 0) return ensureInt(byVat[0].id);
    }
    if (email) {
      const byEmail = await odooSearch(
        "res.partner",
        [["email", "=", email]],
        ["id"],
        1
      );
      if (byEmail.length > 0) return ensureInt(byEmail[0].id);
    }
    return ensureInt(
      await odooCreate("res.partner", {
        name: nom || "Société (demande publique)",
        email: email || false,
        phone: phone || false,
        is_company: true,
        ...(vat ? { vat } : {}),
        ...(belgiumCountryId ? { country_id: belgiumCountryId } : {}),
      })
    );
  }

  // Particulier : par email.
  if (email) {
    const byEmail = await odooSearch(
      "res.partner",
      [["email", "=", email]],
      ["id"],
      1
    );
    if (byEmail.length > 0) return ensureInt(byEmail[0].id);
  }
  return ensureInt(
    await odooCreate("res.partner", {
      name: nom || "Demandeur (demande publique)",
      email: email || false,
      phone: phone || false,
      ...(belgiumCountryId ? { country_id: belgiumCountryId } : {}),
    })
  );
}

// Contact d'une partie (bailleur / locataire) pour les champs structurés
// x_studio_partie_*. Même esprit de dédoublonnage, lecture seule : jamais de
// write sur une fiche existante. Retourne null si pas de nom (champ laissé vide).
async function findOrCreatePartyPartner(party: {
  nom: string;
  email: string;
  tel: string;
}): Promise<number | null> {
  const { nom, email, tel } = party;
  if (!nom) return null;

  if (email) {
    const byEmail = await odooSearch(
      "res.partner",
      [["email", "=", email]],
      ["id"],
      1
    );
    if (byEmail.length > 0) return ensureInt(byEmail[0].id);
  }

  const byName = await odooSearch(
    "res.partner",
    [["name", "=", nom]],
    ["id"],
    1
  );
  if (byName.length > 0) return ensureInt(byName[0].id);

  return ensureInt(
    await odooCreate("res.partner", {
      name: nom,
      ...(email ? { email } : {}),
      ...(tel ? { phone: tel } : {}),
    })
  );
}

// Résout l'ID Belgique (res.country code=BE), null si introuvable.
async function getBelgiumCountryId(): Promise<number | null> {
  try {
    const c = await odooSearch("res.country", [["code", "=", "BE"]], ["id"], 1);
    if (c.length > 0) return ensureInt(c[0].id);
  } catch {
    /* non bloquant */
  }
  return null;
}

// Résout le tag ELE/ELS (sale.order.tag puis crm.tag). undefined si rien.
async function resolveMissionTag(
  mission: string
): Promise<unknown[] | undefined> {
  const tagName = mission === "ELLE" ? "ELE" : "ELS";
  for (const model of ["sale.order.tag", "crm.tag"]) {
    try {
      const tags = (await odooExecute(model, "search_read", [
        [["name", "=", tagName]],
      ], { fields: ["id"], limit: 1 })) as Record<string, unknown>[];
      if (tags.length > 0) return [[4, ensureInt(tags[0].id)]];
    } catch {
      /* modèle absent, on tente le suivant */
    }
  }
  return undefined;
}

/**
 * Crée le devis Odoo (brouillon) pour une demande déjà confirmée, et écrit
 * odoo_order_id dans public_rdv_requests. Idempotent : ne recrée pas si
 * odoo_order_id est déjà rempli. À appeler en try/catch non bloquant.
 */
export async function createOdooOrderForRequest(
  requestId: string
): Promise<{ created: boolean; orderId?: number }> {
  const admin = createAdminClient();

  // Relire la demande (anti-doublon + données).
  const { data, error } = await admin
    .from("public_rdv_requests")
    .select("id, odoo_order_id, form_data, documents")
    .eq("id", requestId)
    .maybeSingle<RequestRow>();

  if (error || !data) {
    throw new Error(
      `public_rdv_requests introuvable pour id=${requestId}: ${error?.message ?? "no row"}`
    );
  }

  // Anti-doublon : devis déjà créé.
  if (data.odoo_order_id) {
    return { created: false, orderId: data.odoo_order_id };
  }

  const form = data.form_data ?? {};
  const who = str(form.who);
  const mission = str(form.mission);
  const address = (form.address ?? {}) as Record<string, unknown>;
  const parties = (form.parties ?? {}) as Record<string, unknown>;
  const sups = (form.sups ?? {}) as Record<string, unknown>;
  const estimate = (form.estimate ?? {}) as Record<string, unknown>;
  const p1 = (parties.p1 ?? {}) as Record<string, unknown>;
  const p2 = (parties.p2 ?? {}) as Record<string, unknown>;

  const belgiumCountryId = await getBelgiumCountryId();

  // Contact principal (dédoublonnage).
  const partnerId = await findOrCreatePartner(form, belgiumCountryId);

  // Adresse de mission (toujours créée, comme submit-rdv).
  const rue = str(address.rue);
  const num = str(address.num);
  const bte = str(address.bte);
  const cp = str(address.cp);
  const ville = str(address.ville);
  const adresseComplete = `${rue} ${num}, ${cp} ${ville}`.trim();
  const adresseStreet = `${rue}, ${num}${bte ? `, ${bte}` : ""}`;
  const adressePartnerId = ensureInt(
    await odooCreate("res.partner", {
      name: adresseComplete || "Adresse de mission",
      street: adresseStreet,
      zip: cp || false,
      city: ville || false,
      ...(belgiumCountryId ? { country_id: belgiumCountryId } : {}),
      type: "delivery",
      parent_id: partnerId,
    })
  );

  // Tag mission (ELE/ELS).
  const tagIds = await resolveMissionTag(mission);

  // sale.order BROUILLON. x_studio_type_de_bien_1 volontairement NON envoyé
  // (à compléter manuellement). Jamais d'action_confirm.
  const orderValues: Record<string, unknown> = {
    partner_id: partnerId,
    partner_shipping_id: adressePartnerId,
    x_studio_adresse_de_mission: adressePartnerId,
    x_studio_portail_client: true,
    x_studio_type_de_client: who === "agence" ? "Agent immobilier" : "Bailleur",
  };
  if (tagIds) orderValues.tag_ids = tagIds;

  const orderId = ensureInt(await odooCreate("sale.order", orderValues));

  // Statut métier de départ (valeur existante dans la liste).
  try {
    await odooExecute("sale.order", "write", [
      [orderId],
      { x_studio_suivi_expert: "Demande reçue", x_studio_portail_client: true },
    ]);
  } catch (e) {
    console.error("[public-rdv] set suivi_expert failed", {
      orderId,
      error: e,
    });
  }

  // Champs structurés Partie 1 (bailleur) / Partie 2 (locataire). Traités
  // INDÉPENDAMMENT du partner_id du devis : chaque champ reflète le nom saisi
  // dans sa case. Vide si pas de nom (aucune fiche créée).
  try {
    const p1Id = await findOrCreatePartyPartner({
      nom: str(p1.nom),
      email: str(p1.email),
      tel: str(p1.tel),
    });
    const p2Id = await findOrCreatePartyPartner({
      nom: str(p2.nom),
      email: str(p2.email),
      tel: str(p2.tel),
    });
    const partyVals: Record<string, unknown> = {};
    if (p1Id) partyVals.x_studio_partie_1_bailleurs_ = p1Id;
    if (p2Id) partyVals.x_studio_partie_2_locataires_ = p2Id;
    if (Object.keys(partyVals).length > 0) {
      await odooExecute("sale.order", "write", [[orderId], partyVals]);
    }
  } catch (e) {
    console.error("[public-rdv] set party partners failed", {
      orderId,
      error: e,
    });
  }

  // Création résiliente d'une ligne : un échec isolé est loggué et n'interrompt
  // jamais les lignes suivantes (notamment les notes).
  const addLine = async (label: string, values: Record<string, unknown>) => {
    try {
      await odooCreate("sale.order.line", { order_id: orderId, ...values });
    } catch (e) {
      console.error("[public-rdv] order line creation failed", {
        orderId,
        line: label,
        error: e,
      });
    }
  };

  // ── Lignes du devis, dans l'ordre ──
  // (a) Section mission
  await addLine("section", {
    name: mission === "ELLE" ? SECTION_ENTREE : SECTION_SORTIE,
    display_type: "line_section",
    product_uom_qty: 0,
    price_unit: 0,
  });

  // (b) Note "montant pour chaque partie..."
  await addLine("note-parties", {
    name: NOTE_PARTIES,
    display_type: "line_note",
    product_uom_qty: 0,
    price_unit: 0,
  });

  // (c) Articles : bien + suppléments. Réf introuvable / sans variante -> skip.
  const bienRefCode = str(estimate.ref);
  if (bienRefCode) {
    const prod = await resolveProduct(bienRefCode);
    if (prod) {
      await addLine("bien", {
        product_id: prod.productId,
        name: prod.name,
        product_uom_qty: 1,
        price_unit: prod.price,
      });
    } else {
      console.error("[public-rdv] product not found (bien)", {
        orderId,
        ref: bienRefCode,
      });
    }
  }

  for (const key of SUPP_KEYS) {
    const qty = Number(sups[key]) || 0;
    if (qty <= 0) continue;
    const code = optionRef(key);
    const prod = await resolveProduct(code);
    if (!prod) {
      console.error("[public-rdv] product not found (option)", {
        orderId,
        ref: code,
      });
      continue;
    }
    await addLine(`option-${key}`, {
      product_id: prod.productId,
      name: prod.name,
      product_uom_qty: qty,
      price_unit: prod.price,
    });
  }

  // (d) Notes finales (omises si vides, sauf "Date de la mission" toujours là)
  const locataireNom = str(p2.nom);
  const proprioNom = str(p1.nom);
  const adresseImmeuble = [
    [cp, ville].filter(Boolean).join(" "),
    [rue, num].filter(Boolean).join(" "),
    bte ? `bte ${bte}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const finalNotes: string[] = [];
  if (locataireNom) finalNotes.push(`Nom du locataire : ${locataireNom}`);
  if (proprioNom) finalNotes.push(`Nom du propriétaire : ${proprioNom}`);
  if (adresseImmeuble)
    finalNotes.push(`Adresse de l'immeuble concerné : ${adresseImmeuble}`);
  finalNotes.push("Date de la mission :");

  for (const note of finalNotes) {
    await addLine("note-finale", {
      name: note,
      display_type: "line_note",
      product_uom_qty: 0,
      price_unit: 0,
    });
  }

  // Rattachement : odoo_order_id (sert aussi d'anti-doublon).
  const { error: updateError } = await admin
    .from("public_rdv_requests")
    .update({ odoo_order_id: orderId })
    .eq("id", requestId);
  if (updateError) {
    console.error("[public-rdv] failed to store odoo_order_id", {
      requestId,
      orderId,
      error: updateError,
    });
  }

  // ── Pièces jointes : attacher au devis (trombone) les fichiers stockés ──
  // Lecture SEULE du préfixe public/ (chemins listés dans documents). Résilience
  // par fichier : un échec est loggué et n'interrompt pas les autres. Ce bloc
  // n'est atteint qu'à la création (verrou odoo_order_id) -> pas de ré-attachement.
  const docs = Array.isArray(data.documents) ? data.documents : [];
  for (const doc of docs) {
    if (!doc?.path) continue;
    try {
      const { data: blob, error: dlError } = await admin.storage
        .from("rdv-documents")
        .download(doc.path);
      if (dlError || !blob) {
        console.error("[public-rdv] attachment download failed", {
          requestId,
          orderId,
          path: doc.path,
          error: dlError?.message ?? "no blob",
        });
        continue;
      }
      const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
      await odooCreate("ir.attachment", {
        name: doc.name || "document",
        datas: base64,
        res_model: "sale.order",
        res_id: orderId,
        ...(doc.mime ? { mimetype: doc.mime } : {}),
        type: "binary",
      });
    } catch (e) {
      console.error("[public-rdv] attachment create failed", {
        requestId,
        orderId,
        path: doc.path,
        error: e,
      });
    }
  }

  return { created: true, orderId };
}
