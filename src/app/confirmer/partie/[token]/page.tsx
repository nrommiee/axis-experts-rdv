import { createAdminClient } from "@/lib/supabase/admin";
import { parseRdvDate } from "@/lib/parseRdvDate";
import { PARTY_LABEL, type Party } from "@/lib/public-rdv/validation";
import ValidateClient from "./ValidateClient";
import styles from "../../confirmer.module.css";

export const dynamic = "force-dynamic";

// Page d'arrivée du lien de validation par partie /confirmer/partie/[token].
// Couverte par l'exemption proxy existante /confirmer (zéro modif middleware).
// Lecture service_role ; validation AU CLIC (POST), pas au chargement.

const LOGO_URL =
  "https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png";

export const metadata = {
  title: "Confirmer ma présence — Axis Experts",
};

interface PartyRow {
  odoo_order_id: number;
  party: string;
  status: string;
  rdv_date_string: string | null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.hwrap}>
          <div className={styles.brand}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Axis Experts" className={styles.logo} />
            <div className={styles.brandText}>
              <b>Axis Experts</b>
              <span>Expertise immobilière</span>
            </div>
          </div>
        </div>
      </header>
      <div className={styles.page}>
        <div className={styles.banner}>📩 Vous avez reçu ce lien par email</div>
        {children}
      </div>
    </div>
  );
}

function NoticeCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className={`${styles.card} ${styles.success}`}>
      <div className={styles.notice}>{icon}</div>
      <h1>{title}</h1>
      <p className={styles.lead}>{text}</p>
    </div>
  );
}

export default async function ValiderPartiePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data } = await admin
    .from("public_rdv_party_validations")
    .select("odoo_order_id, party, status, rdv_date_string")
    .eq("token", token)
    .maybeSingle<PartyRow>();

  // Cas 1 — introuvable.
  if (!data) {
    return (
      <Shell>
        <NoticeCard
          icon="🔗"
          title="Lien invalide"
          text="Ce lien ne correspond à aucune demande de validation."
        />
      </Shell>
    );
  }

  const party = data.party as Party;
  const partyLabel = PARTY_LABEL[party] ?? "";
  const parsed = parseRdvDate(data.rdv_date_string);
  const dateLabel =
    parsed.date && parsed.time
      ? `${parsed.date} à ${parsed.time}`
      : parsed.date ?? "";

  // Cas 2 — déjà confirmée (usage unique).
  if (data.status === "confirmed") {
    return (
      <Shell>
        <NoticeCard
          icon="✓"
          title="Présence déjà confirmée"
          text="Votre présence a déjà été confirmée. Pour toute modification, contactez-nous au 02 880 90 90 ou à info@axis-experts.be."
        />
      </Shell>
    );
  }

  // Cas 3 — pending : récap + bouton de validation (au clic).
  return (
    <Shell>
      <ValidateClient
        token={token}
        partyLabel={partyLabel}
        dateLabel={dateLabel}
      />
    </Shell>
  );
}
