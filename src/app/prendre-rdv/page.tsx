"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./prendre-rdv.module.css";
import {
  bienRef,
  optionRef,
  tvacPerParty,
  type PublicPrices,
} from "@/lib/public-rdv/pricing";

const LOGO_URL =
  "https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png";

const MNAME: Record<string, string> = {
  ELLE: "État des lieux d'entrée",
  ELLS: "État des lieux de sortie",
};

const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison/Villa",
  studio: "Studio",
  kot: "Kot (mobilier inclus)",
};

// Suppléments disponibles par type de bien (repris de la maquette v13).
const SUP_ALLOWED: Record<string, string[]> = {
  appartement: ["meuble", "jardin", "sanitaire", "garage", "cave"],
  maison: ["meuble", "jardin", "sanitaire", "garage", "cave"],
  studio: ["meuble", "jardin", "garage", "cave"],
  kot: [],
};

// Libellés + métadonnées d'affichage des suppléments. Le prix vient d'Odoo
// (AXIS_OPT_*), sauf "cave" qui est offert (pas d'article, 0 €).
const SUP_META: Record<
  string,
  { label: string; qty: boolean; free?: boolean }
> = {
  meuble: { label: "Meublé", qty: false },
  jardin: { label: "Jardin", qty: false },
  sanitaire: { label: "Sanitaire suppl.", qty: true },
  garage: { label: "Garage / pièce", qty: true },
  cave: { label: "Cave / terrasse", qty: false, free: true },
};

type Who = "proprietaire" | "locataire" | "agence";
type Ptype = "phys" | "soc";

const ROLE_OPTIONS = [
  "Avocat",
  "Assistant social",
  "Gérant / Mandataire",
  "Régie / Agence",
  "Syndic",
  "Notaire",
  "Autre",
];

export default function PrendreRdvPage() {
  // --- prix live depuis l'API publique ---
  const [prices, setPrices] = useState<PublicPrices | null>(null);
  const [pricesError, setPricesError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/prices")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { prices: PublicPrices }) => {
        if (!cancelled) setPrices(data.prices ?? {});
      })
      .catch(() => {
        if (!cancelled) setPricesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- état du formulaire (équivalent de l'objet S de la maquette) ---
  const [who, setWho] = useState<Who>("proprietaire");
  const [ptype, setPtype] = useState<Ptype>("phys");
  const [mission, setMission] = useState("ELLE");
  const [type, setType] = useState("appartement");
  const [tcode, setTcode] = useState("A");
  const [chambres, setChambres] = useState(1);
  const [sups, setSups] = useState<Record<string, number>>({
    meuble: 0,
    jardin: 0,
    sanitaire: 0,
    garage: 0,
    cave: 0,
  });

  // Demandeur (utilisés pour pré-remplir les parties)
  const [dNom, setDNom] = useState("");
  const [dEmail, setDEmail] = useState("");
  const [dTel, setDTel] = useState("");
  const [socNom, setSocNom] = useState("");
  const [socEmail, setSocEmail] = useState("");
  const [socTel, setSocTel] = useState("");
  const [agNom, setAgNom] = useState("");
  const [agEmail, setAgEmail] = useState("");
  const [agTel, setAgTel] = useState("");
  const [agCode, setAgCode] = useState("");
  const [agRapport, setAgRapport] = useState(false);

  // Adresse mission
  const [mRue, setMRue] = useState("");
  const [mNum, setMNum] = useState("");
  const [mBte, setMBte] = useState("");
  const [mCp, setMCp] = useState("");
  const [mVille, setMVille] = useState("");

  // Présence parties + warnings
  const [p1Pres, setP1Pres] = useState("oui");
  const [p2Pres, setP2Pres] = useState("oui");
  const [c1Open, setC1Open] = useState(false);
  const [c2Open, setC2Open] = useState(false);

  // Étape 5 (sortie)
  const [entreeWho, setEntreeWho] = useState("axis");

  // Étape 6 (infos complémentaires)
  const [optOpen, setOptOpen] = useState(false);
  const [mEau, setMEau] = useState("");

  // Étape 7 (dispos)
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [horaire, setHoraire] = useState("Matin");

  // Consentement / UI
  const [consent, setConsent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errIds, setErrIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3800);
  }

  // Date minimale : +2 jours
  const minDate = useMemo(() => {
    const m = new Date();
    m.setDate(m.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`;
  }, []);

  const dateWarn = useMemo(() => {
    let warn = false;
    for (const v of [d1, d2]) {
      if (!v) continue;
      const d = new Date(v + "T00:00:00");
      if (d.getDay() === 0 || d.getDay() === 6) warn = true;
      if (v < minDate) warn = true;
    }
    return warn;
  }, [d1, d2, minDate]);

  // --- dérivés d'affichage ---
  const isAgence = who === "agence";
  const isSoc = ptype === "soc";
  const allowedSups = useMemo(() => SUP_ALLOWED[type] ?? [], [type]);
  const showChambres = tcode !== "S" && tcode !== "K";

  // Demandeur courant (pour pré-remplissage parties)
  const demandeur = useMemo(() => {
    if (who === "agence") return { n: agNom, e: agEmail, t: agTel };
    if (ptype === "soc") return { n: socNom, e: socEmail, t: socTel };
    return { n: dNom, e: dEmail, t: dTel };
  }, [
    who,
    ptype,
    agNom,
    agEmail,
    agTel,
    socNom,
    socEmail,
    socTel,
    dNom,
    dEmail,
    dTel,
  ]);

  // --- calcul du devis (formule unique : round(htva × 1,21 ÷ 2) par partie) ---
  const quote = useMemo(() => {
    if (!prices) return null;

    // >5 chambres pour appartement/maison → sur devis
    if (chambres === 6 && (tcode === "A" || tcode === "M")) {
      return { devis: true as const, msg: "Plus de 5 chambres — devis personnalisé" };
    }

    const ref = bienRef(mission, tcode, chambres);
    const bien = prices[ref];
    if (!bien) {
      // Référence absente d'Odoo → on n'invente pas de prix
      return { devis: true as const, msg: "Tarif sur demande — nous consulter" };
    }

    const baseParty = tvacPerParty(bien.htva);

    // Suppléments actifs (autorisés pour ce type de bien)
    const subLines: { label: string; perParty: number }[] = [];
    for (const key of allowedSups) {
      const qty = sups[key] ?? 0;
      if (qty <= 0) continue;
      const meta = SUP_META[key];
      if (meta.free) continue; // cave offerte
      const opt = prices[optionRef(key)];
      if (!opt) continue;
      const perParty = tvacPerParty(opt.htva) * qty;
      subLines.push({
        label: meta.label + (qty > 1 ? " ×" + qty : ""),
        perParty,
      });
    }

    const subTotalParty = subLines.reduce((s, l) => s + l.perParty, 0);
    const perParty = baseParty + subTotalParty;

    let bienLbl = TYPE_LABEL[type];
    if (tcode !== "S" && tcode !== "K") bienLbl += " · " + chambres + " ch.";

    return {
      devis: false as const,
      bienLbl,
      baseParty,
      subLines,
      perParty,
      total: perParty * 2,
    };
  }, [prices, chambres, tcode, mission, type, allowedSups, sups]);

  // --- handlers suppléments ---
  function toggleSup(key: string) {
    setSups((s) => ({ ...s, [key]: s[key] ? 0 : 1 }));
  }
  function bumpSup(key: string, delta: number) {
    setSups((s) => ({ ...s, [key]: Math.max(0, (s[key] ?? 0) + delta) }));
  }

  // --- validation + soumission (maquette : pas d'envoi réel) ---
  function requiredIds(): string[] {
    const req: string[] = [];
    if (who === "agence") req.push("agNom", "agEmail", "agCode");
    else if (ptype === "soc") req.push("socNom", "socEmail");
    else req.push("dNom", "dEmail");
    req.push("mRue", "mCp", "mVille");
    return req;
  }

  function valueOf(id: string): string {
    const map: Record<string, string> = {
      agNom,
      agEmail,
      agCode,
      socNom,
      socEmail,
      dNom,
      dEmail,
      mRue,
      mCp,
      mVille,
    };
    return map[id] ?? "";
  }

  function validate(): boolean {
    const missing = new Set<string>();
    for (const id of requiredIds()) {
      if (!valueOf(id).trim()) missing.add(id);
    }
    setErrIds(missing);
    if (missing.size) {
      showToast(
        "Le formulaire n'est pas complet — vérifiez les champs en rouge."
      );
      return false;
    }
    return true;
  }

  // Nom du demandeur selon le profil (perso / société / agence).
  function demandeurNom(): string {
    if (who === "agence") return agNom;
    if (ptype === "soc") return socNom;
    return dNom;
  }

  // Construit le payload envoyé à l'API (forme attendue par publicRdvSchema).
  function buildPayload() {
    return {
      who,
      ptype,
      mission,
      propertyType: type,
      chambres,
      sups,
      nom: demandeurNom().trim(),
      email: demandeur.e.trim(),
      phone: demandeur.t.trim(),
      agCode: agCode.trim(),
      address: {
        rue: mRue.trim(),
        num: mNum.trim(),
        bte: mBte.trim(),
        cp: mCp.trim(),
        ville: mVille.trim(),
      },
      parties: {
        p1: { present: p1Pres },
        p2: { present: p2Pres },
      },
      availability: { dateDebut: d1, dateFin: d2, horaire },
      extras: { eau: mEau.trim() },
      estimate:
        quote && !quote.devis
          ? { ref: bienRef(mission, tcode, chambres), perParty: quote.perParty, total: quote.total, devis: false }
          : { devis: true },
      consent: true as const,
    };
  }

  async function onSubmit() {
    if (submitting) return;
    if (!consent) {
      showToast("Cochez l'acceptation des conditions pour continuer.");
      return;
    }
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/rdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        setShowModal(true);
      } else {
        const data = await res.json().catch(() => null);
        showToast(
          (data && (data.details || data.error)) ||
            "Une erreur est survenue. Réessayez dans un instant."
        );
      }
    } catch {
      showToast("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  const errClass = (id: string) => (errIds.has(id) ? " " + styles.err : "");

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.wrap}>
          <div className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Axis Experts" className={styles.logo} />
            <div className={styles.brandText}>
              <b>Axis Experts</b>
              <span>Expertise immobilière</span>
            </div>
          </div>
          <h1>
            Demande de <em>rendez-vous</em> en ligne
          </h1>
        </div>
      </header>

      <div className={`${styles.wrap} ${styles.grid}`}>
        <form onSubmit={(e) => e.preventDefault()}>
          {/* 1 DEMANDEUR */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>1</div>
              <div>
                <h2>Le demandeur</h2>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.fl}>Vous êtes</label>
              <div className={styles.chips}>
                {(
                  [
                    ["proprietaire", "Propriétaire / Bailleur"],
                    ["locataire", "Locataire"],
                    ["agence", "Agence Immobilière"],
                  ] as [Who, string][]
                ).map(([val, label]) => (
                  <div
                    key={val}
                    className={`${styles.chip}${who === val ? " " + styles.on : ""}`}
                    onClick={() => setWho(val)}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {!isAgence && (
              <div className={styles.row}>
                <label className={styles.fl}>Type</label>
                <div className={styles.chips}>
                  {(
                    [
                      ["phys", "Personne physique"],
                      ["soc", "Société"],
                    ] as [Ptype, string][]
                  ).map(([val, label]) => (
                    <div
                      key={val}
                      className={`${styles.chip}${ptype === val ? " " + styles.on : ""}`}
                      onClick={() => setPtype(val)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* physique */}
            {!isAgence && !isSoc && (
              <>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>
                      Nom <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text"
                      className={errClass("dNom").trim()}
                      placeholder="Votre nom"
                      value={dNom}
                      onChange={(e) => setDNom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>
                      Email <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="email"
                      className={errClass("dEmail").trim()}
                      placeholder="vous@email.be"
                      value={dEmail}
                      onChange={(e) => setDEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>Téléphone / mobile</label>
                    <input
                      type="tel"
                      placeholder="+32 …"
                      value={dTel}
                      onChange={(e) => setDTel(e.target.value)}
                    />
                  </div>
                  <div />
                </div>
              </>
            )}

            {/* société */}
            {!isAgence && isSoc && (
              <>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>
                      Nom de la société <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text"
                      className={errClass("socNom").trim()}
                      placeholder="Raison sociale"
                      value={socNom}
                      onChange={(e) => setSocNom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>
                      N° d&apos;entreprise (BCE / TVA)
                    </label>
                    <input type="text" placeholder="BE0…" />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>
                      Email société <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="email"
                      className={errClass("socEmail").trim()}
                      placeholder="info@societe.be"
                      value={socEmail}
                      onChange={(e) => setSocEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>Téléphone société</label>
                    <input
                      type="tel"
                      placeholder="+32 …"
                      value={socTel}
                      onChange={(e) => setSocTel(e.target.value)}
                    />
                  </div>
                </div>
                <label className={styles.fl}>Adresse de la société</label>
                <div className={styles.addrgrid}>
                  <input type="text" placeholder="Rue" />
                  <input type="text" placeholder="N°" />
                  <input type="text" placeholder="Bte" />
                </div>
                <div
                  className={styles.addrgrid2}
                  style={{ marginBottom: "18px" }}
                >
                  <input type="text" placeholder="Code postal" />
                  <input type="text" placeholder="Ville" />
                </div>
                <div className={styles.subhd}>Personne de contact</div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>Prénom</label>
                    <input type="text" placeholder="Prénom" />
                  </div>
                  <div>
                    <label className={styles.fl}>Nom</label>
                    <input type="text" placeholder="Nom" />
                  </div>
                </div>
                <div className={styles.row}>
                  <div>
                    <label className={styles.fl}>Email</label>
                    <input type="email" placeholder="@" />
                  </div>
                </div>
              </>
            )}

            {/* agence */}
            {isAgence && (
              <>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>
                      Nom de l&apos;agence <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text"
                      className={errClass("agNom").trim()}
                      placeholder="Nom de l'agence"
                      value={agNom}
                      onChange={(e) => setAgNom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>
                      Email <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="email"
                      className={errClass("agEmail").trim()}
                      placeholder="agence@email.be"
                      value={agEmail}
                      onChange={(e) => setAgEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>Téléphone</label>
                    <input
                      type="tel"
                      placeholder="+32 …"
                      value={agTel}
                      onChange={(e) => setAgTel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>
                      Code partenaire <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text"
                      className={errClass("agCode").trim()}
                      placeholder="Votre identifiant agence partenaire"
                      value={agCode}
                      onChange={(e) => setAgCode(e.target.value)}
                    />
                  </div>
                </div>
                {agCode.trim() && (
                  <div className={styles.trust}>
                    ✓ Agence partenaire reconnue — demande{" "}
                    <b>confirmée directement</b> (sans validation email/WhatsApp).
                    Le contact ci-dessus sera ajouté comme{" "}
                    <b>contact référent du devis</b>, relié à votre compte agence.
                  </div>
                )}
                <div>
                  <label className={styles.fl}>
                    Vous souhaitez être informé de
                  </label>
                  <label className={styles.check}>
                    <input type="checkbox" defaultChecked />
                    <span>
                      <b>Date &amp; heure du RDV</b> confirmées
                    </span>
                  </label>
                  <label className={styles.check}>
                    <input
                      type="checkbox"
                      checked={agRapport}
                      onChange={(e) => setAgRapport(e.target.checked)}
                    />
                    <span>
                      <b>Copie du rapport</b> d&apos;expertise final
                    </span>
                  </label>
                </div>
              </>
            )}
          </section>

          {/* 2 MISSION */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>2</div>
              <div>
                <h2>Le type de mission</h2>
              </div>
            </div>
            <div className={styles.chips}>
              {(
                [
                  ["ELLE", "État des lieux d'entrée"],
                  ["ELLS", "État des lieux de sortie"],
                ] as [string, string][]
              ).map(([val, label]) => (
                <div
                  key={val}
                  className={`${styles.chip}${mission === val ? " " + styles.on : ""}`}
                  onClick={() => setMission(val)}
                >
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* 3 BIEN */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>3</div>
              <div>
                <h2>Le bien</h2>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.fl}>Type de bien</label>
              <div className={styles.chips}>
                {(
                  [
                    ["appartement", "A", "Appartement"],
                    ["maison", "M", "Maison / Villa"],
                    ["studio", "S", "Studio / Flat"],
                    ["kot", "K", "Kot / Chambre étudiant"],
                  ] as [string, string, string][]
                ).map(([val, code, label]) => (
                  <div
                    key={val}
                    className={`${styles.chip}${type === val ? " " + styles.on : ""}`}
                    onClick={() => {
                      setType(val);
                      setTcode(code);
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {showChambres && (
              <div className={styles.row}>
                <label className={styles.fl}>Nombre de chambres</label>
                <div className={styles.chips}>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className={`${styles.chip}${chambres === n ? " " + styles.on : ""}`}
                      onClick={() => setChambres(n)}
                    >
                      {n === 6 ? "+5 — nous consulter" : n}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allowedSups.length > 0 && (
              <div className={styles.row}>
                <label className={styles.fl}>Suppléments</label>
                <div className={styles.sups}>
                  {allowedSups.map((key) => {
                    const meta = SUP_META[key];
                    const active = (sups[key] ?? 0) > 0;
                    if (meta.qty) {
                      return (
                        <div
                          key={key}
                          className={`${styles.sup}${active ? " " + styles.on : ""}`}
                        >
                          <span className={styles.t}>{meta.label}</span>
                          <span className={styles.qty}>
                            <button
                              type="button"
                              onClick={() => bumpSup(key, -1)}
                            >
                              −
                            </button>
                            <b>{sups[key] ?? 0}</b>
                            <button
                              type="button"
                              onClick={() => bumpSup(key, 1)}
                            >
                              +
                            </button>
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={key}
                        className={`${styles.sup}${active ? " " + styles.on : ""}`}
                        onClick={() => !meta.free && toggleSup(key)}
                      >
                        <span className={styles.t}>{meta.label}</span>
                        {meta.free ? (
                          <span className={`${styles.p} ${styles.free}`}>
                            offert
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.row}>
              <label className={styles.fl}>
                Adresse de la mission <span className={styles.req}>*</span>
              </label>
              <div className={styles.addrgrid}>
                <input
                  type="text"
                  className={errClass("mRue").trim()}
                  placeholder="Rue"
                  value={mRue}
                  onChange={(e) => setMRue(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="N°"
                  value={mNum}
                  onChange={(e) => setMNum(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Bte"
                  value={mBte}
                  onChange={(e) => setMBte(e.target.value)}
                />
              </div>
              <div className={styles.addrgrid2}>
                <input
                  type="text"
                  className={errClass("mCp").trim()}
                  placeholder="Code postal"
                  value={mCp}
                  onChange={(e) => setMCp(e.target.value)}
                />
                <input
                  type="text"
                  className={errClass("mVille").trim()}
                  placeholder="Ville"
                  value={mVille}
                  onChange={(e) => setMVille(e.target.value)}
                />
              </div>
              <div className={styles.map}>
                <div className={styles.pin} />
                <div className={styles.lbl}>📍 Aperçu — adresse encodée</div>
              </div>
            </div>
          </section>

          {/* 4 PARTIES */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>4</div>
              <div>
                <h2>Les parties</h2>
              </div>
            </div>
            <div className={`${styles.row} ${styles.two}`}>
              {/* Partie 1 — Bailleur */}
              <div className={styles.party}>
                <h3>
                  <span className={styles.tag}>Partie 1</span> Bailleur{" "}
                  {who === "proprietaire" && demandeur.n && (
                    <span className={styles.pfrom}>demandeur</span>
                  )}
                </h3>
                <div className={styles.row}>
                  <div>
                    <label className={styles.fl}>Nom</label>
                    <input
                      type="text"
                      placeholder="Propriétaire / bailleur"
                      defaultValue={
                        who === "proprietaire" ? demandeur.n : ""
                      }
                    />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>Email</label>
                    <input
                      type="email"
                      placeholder="@"
                      defaultValue={
                        who === "proprietaire" ? demandeur.e : ""
                      }
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>Téléphone</label>
                    <input type="tel" placeholder="+32" />
                  </div>
                </div>
                <label className={styles.fl}>
                  Présent sur place lors du RDV ?
                </label>
                <div className={styles.chips}>
                  {["oui", "non"].map((v) => (
                    <div
                      key={v}
                      className={`${styles.chip}${p1Pres === v ? " " + styles.on : ""}`}
                      onClick={() => setP1Pres(v)}
                    >
                      {v === "oui" ? "Oui (recommandé)" : "Non"}
                    </div>
                  ))}
                </div>
                {p1Pres === "non" && (
                  <div className={styles.info}>
                    En cas d&apos;absence, une <b>procuration</b> doit être donnée
                    à un tiers présent, ou notre <b>ordre de mission</b> complété
                    et signé avant le rendez-vous.
                  </div>
                )}
                <button
                  type="button"
                  className={styles.addbtn}
                  style={{ marginTop: "12px" }}
                  onClick={() => setC1Open((o) => !o)}
                >
                  {c1Open
                    ? "− Retirer le conseil / intervenant"
                    : "+ Conseil / intervenant"}
                </button>
                {c1Open && (
                  <div className={styles.conseil}>
                    <div className={`${styles.row} ${styles.two}`}>
                      <div>
                        <label className={styles.fl}>Nom</label>
                        <input type="text" placeholder="Nom du conseil" />
                      </div>
                      <div>
                        <label className={styles.fl}>Rôle</label>
                        <select>
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={`${styles.row} ${styles.two}`}>
                      <div>
                        <label className={styles.fl}>Email</label>
                        <input type="email" placeholder="@" />
                      </div>
                      <div>
                        <label className={styles.fl}>Téléphone</label>
                        <input type="tel" placeholder="+32" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Partie 2 — Locataire */}
              <div className={styles.party}>
                <h3>
                  <span className={styles.tag}>Partie 2</span> Locataire{" "}
                  {who === "locataire" && demandeur.n && (
                    <span className={styles.pfrom}>demandeur</span>
                  )}
                </h3>
                <div className={styles.row}>
                  <div>
                    <label className={styles.fl}>Nom</label>
                    <input
                      type="text"
                      placeholder="Locataire entrant / sortant"
                      defaultValue={who === "locataire" ? demandeur.n : ""}
                    />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>Email</label>
                    <input
                      type="email"
                      placeholder="@"
                      defaultValue={who === "locataire" ? demandeur.e : ""}
                    />
                  </div>
                  <div>
                    <label className={styles.fl}>Téléphone</label>
                    <input type="tel" placeholder="+32" />
                  </div>
                </div>
                <label className={styles.fl}>
                  Présent sur place lors du RDV ?
                </label>
                <div className={styles.chips}>
                  {["oui", "non"].map((v) => (
                    <div
                      key={v}
                      className={`${styles.chip}${p2Pres === v ? " " + styles.on : ""}`}
                      onClick={() => setP2Pres(v)}
                    >
                      {v === "oui" ? "Oui (recommandé)" : "Non"}
                    </div>
                  ))}
                </div>
                {p2Pres === "non" && (
                  <div className={styles.info}>
                    En cas d&apos;absence, une <b>procuration</b> doit être donnée
                    à un tiers présent, ou notre <b>ordre de mission</b> complété
                    et signé avant le rendez-vous.
                  </div>
                )}
                <button
                  type="button"
                  className={styles.addbtn}
                  style={{ marginTop: "12px" }}
                  onClick={() => setC2Open((o) => !o)}
                >
                  {c2Open
                    ? "− Retirer le conseil / intervenant"
                    : "+ Conseil / intervenant"}
                </button>
                {c2Open && (
                  <div className={styles.conseil}>
                    <div className={`${styles.row} ${styles.two}`}>
                      <div>
                        <label className={styles.fl}>Nom</label>
                        <input type="text" placeholder="Nom du conseil" />
                      </div>
                      <div>
                        <label className={styles.fl}>Rôle</label>
                        <select>
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className={`${styles.row} ${styles.two}`}>
                      <div>
                        <label className={styles.fl}>Email</label>
                        <input type="email" placeholder="@" />
                      </div>
                      <div>
                        <label className={styles.fl}>Téléphone</label>
                        <input type="tel" placeholder="+32" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 5 DOCUMENTS */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>5</div>
              <div>
                <h2>Les documents</h2>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.fl}>Bail (ou projet de bail)</label>
              <div className={styles.drop}>
                <b>Glissez le bail</b> ou cliquez — un{" "}
                <b>projet de bail, même non signé</b>, suffit.
                <div className={styles.fmt}>PDF, Word ou Excel</div>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.fl}>Autres documents</label>
              <div className={styles.drop}>
                <b>Ajoutez un ou plusieurs fichiers</b> — relevés, attestations,
                clés…
                <div className={styles.fmt}>
                  PDF, Word ou Excel · plusieurs fichiers acceptés
                </div>
              </div>
            </div>
            {mission === "ELLS" && (
              <div>
                <label className={styles.fl}>
                  Rapport d&apos;état des lieux d&apos;entrée
                </label>
                <div className={styles.chips}>
                  {(
                    [
                      ["axis", "Réalisé par Axis Experts"],
                      ["tiers", "Réalisé par un tiers"],
                    ] as [string, string][]
                  ).map(([val, label]) => (
                    <div
                      key={val}
                      className={`${styles.chip}${entreeWho === val ? " " + styles.on : ""}`}
                      onClick={() => setEntreeWho(val)}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                {entreeWho === "axis" ? (
                  <div className={styles.row} style={{ marginTop: "12px" }}>
                    <input
                      type="text"
                      placeholder="Référence du dossier d'entrée — optionnel, on le retrouve"
                    />
                  </div>
                ) : (
                  <div className={styles.row} style={{ marginTop: "12px" }}>
                    <div className={styles.drop}>
                      <b>Téléversez</b> le rapport d&apos;entrée du tiers
                      <div className={styles.fmt}>PDF, Word ou Excel</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 6 INFOS */}
          <section className={styles.step}>
            <div
              className={`${styles.stepH} ${styles.collapsible}${optOpen ? " " + styles.open : ""}`}
              onClick={() => setOptOpen((o) => !o)}
            >
              <div className={styles.num}>6</div>
              <div>
                <h2>
                  Infos complémentaires{" "}
                  <span className={styles.opt}>optionnel</span>
                </h2>
                <p>Tout ce qui aide, rien d&apos;obligatoire.</p>
              </div>
              <span className={`${styles.chev}${optOpen ? " " + styles.up : ""}`}>
                ▾
              </span>
            </div>
            {optOpen && (
              <div>
                <label className={styles.fl} style={{ marginTop: "4px" }}>
                  Compteurs
                </label>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>N° compteur eau</label>
                    <input
                      type="text"
                      placeholder="N° de compteur"
                      value={mEau}
                      onChange={(e) => setMEau(e.target.value)}
                    />
                  </div>
                  {mEau.trim() && (
                    <div>
                      <label className={styles.fl}>Fournisseur eau</label>
                      <select>
                        <option value="">— Sélectionner —</option>
                        <option>SWDE</option>
                        <option>Vivaqua</option>
                        <option>INBW</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>N° compteur électricité</label>
                    <input type="text" placeholder="N° de compteur" />
                  </div>
                  <div>
                    <label className={styles.fl}>Code EAN électricité</label>
                    <input type="text" placeholder="54…" />
                  </div>
                </div>
                <div className={`${styles.row} ${styles.two}`}>
                  <div>
                    <label className={styles.fl}>N° compteur gaz</label>
                    <input type="text" placeholder="N° de compteur" />
                  </div>
                  <div>
                    <label className={styles.fl}>Code EAN gaz</label>
                    <input type="text" placeholder="54…" />
                  </div>
                </div>
                <div className={styles.row} style={{ marginTop: "18px" }}>
                  <label className={styles.fl}>Note libre</label>
                  <textarea placeholder="Accès, digicode, particularités du bien, contraintes horaires…" />
                </div>
              </div>
            )}
          </section>

          {/* 7 DISPOS */}
          <section className={styles.step}>
            <div className={styles.stepH}>
              <div className={styles.num}>7</div>
              <div>
                <h2>Vos disponibilités</h2>
                <p>Une plage : nous proposons une date dedans.</p>
              </div>
            </div>
            <div className={`${styles.row} ${styles.two}`}>
              <div>
                <label className={styles.fl}>Disponible à partir du</label>
                <input
                  type="date"
                  min={minDate}
                  value={d1}
                  onChange={(e) => setD1(e.target.value)}
                />
              </div>
              <div>
                <label className={styles.fl}>Jusqu&apos;au</label>
                <input
                  type="date"
                  min={minDate}
                  value={d2}
                  onChange={(e) => setD2(e.target.value)}
                />
              </div>
            </div>
            {dateWarn && (
              <div className={styles.warn}>
                ⚠️ Pour un rendez-vous le <b>week-end</b>, en <b>urgence</b> ou
                sous <b>48 h</b>, contactez-nous au <b>02 880 90 90</b>.
              </div>
            )}
            <div className={styles.row} style={{ marginTop: "14px" }}>
              <label className={styles.fl}>Préférence horaire</label>
              <div className={styles.chips}>
                {["Matin", "Après-midi", "Indifférent"].map((h) => (
                  <div
                    key={h}
                    className={`${styles.chip}${horaire === h ? " " + styles.on : ""}`}
                    onClick={() => setHoraire(h)}
                  >
                    {h}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </form>

        {/* SIDEBAR DEVIS */}
        <aside>
          <div className={styles.quote}>
            <div className={styles.qt}>Votre estimation</div>
            <div className={styles.qs}>{MNAME[mission]}</div>

            {!prices && !pricesError && (
              <div className={styles.qline}>
                <span>Chargement des tarifs…</span>
              </div>
            )}
            {pricesError && (
              <div className={styles.warn}>
                Tarifs momentanément indisponibles. Vous pouvez tout de même
                préparer votre demande.
              </div>
            )}

            {quote && quote.devis && (
              <div>
                <div className={styles.qline}>
                  <span>{quote.msg}</span>
                </div>
                <div className={styles.qbig}>
                  <span className={styles.lab}>Tarif</span>
                  <span className={styles.amt}>
                    <span className={styles.devisOnly}>Sur devis</span>
                  </span>
                </div>
              </div>
            )}

            {quote && !quote.devis && (
              <div>
                <div className={styles.qline}>
                  <span>{quote.bienLbl}</span>
                  <span className={styles.v}>{quote.baseParty} €</span>
                </div>
                <div className={styles.qsubs}>
                  {quote.subLines.map((l, i) => (
                    <div key={i}>
                      <span>+ {l.label}</span>
                      <span>{l.perParty} €</span>
                    </div>
                  ))}
                </div>
                <div className={styles.qparties}>
                  <div className={styles.qpl}>
                    <span>Honoraires bailleur</span>
                    <span>{quote.perParty} € TVAC</span>
                  </div>
                  <div className={styles.qpl}>
                    <span>Honoraires locataire</span>
                    <span>{quote.perParty} € TVAC</span>
                  </div>
                </div>
                <div className={styles.qbig}>
                  <span className={styles.lab}>
                    Total <small>(TVAC)</small>
                  </span>
                  <span className={styles.amt}>{quote.total} €</span>
                </div>
              </div>
            )}

            <label className={styles.qconsent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                J&apos;accepte le traitement de mes données conformément à la{" "}
                <b>politique de confidentialité</b>.
              </span>
            </label>
            <button
              className={`${styles.cta}${consent && !submitting ? "" : " " + styles.off}`}
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? "Envoi…" : "Demander le rendez-vous →"}
            </button>
            {!consent && (
              <div className={styles.consentHint}>
                Cochez l&apos;acceptation des conditions pour activer la demande.
              </div>
            )}
            <div className={styles.qmention}>
              Prix <b>TVAC (TVA 21 % comprise)</b>, indicatif et basé sur les
              informations que vous avez encodées. En cas d&apos;écart avec la
              configuration réelle du bien constatée sur place, Axis Experts se
              réserve le droit de recalculer les honoraires.
            </div>
          </div>
        </aside>
      </div>

      {/* Toast */}
      <div className={`${styles.toast}${toast ? " " + styles.show : ""}`}>
        {toast}
      </div>

      {/* Modale post-clic (pas de soumission réelle à cette étape) */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>📩</div>
            <h3>Vérifiez vos emails</h3>
            <p>
              Vous allez recevoir un email. Votre demande ne sera{" "}
              <b>prise en compte qu&apos;une fois le lien validé</b>.
            </p>
            <button
              type="button"
              className={styles.modalBtn}
              onClick={() => setShowModal(false)}
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
