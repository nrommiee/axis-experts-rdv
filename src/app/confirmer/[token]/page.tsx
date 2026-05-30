import { createAdminClient } from "@/lib/supabase/admin";
import { buildRecap } from "@/lib/public-rdv/recap";
import ConfirmClient from "./ConfirmClient";
import styles from "../confirmer.module.css";

export const dynamic = "force-dynamic";

// Page d'arrivée du lien email /confirmer/[token]. Lecture service_role côté
// serveur ; le token n'est jamais réexposé. La confirmation elle-même se fait
// AU CLIC (POST), pas au chargement (évite les scanners mail qui pré-ouvrent
// les liens). Aucun devis Odoo créé à cette étape.

const LOGO_URL =
  "https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png";

export const metadata = {
  title: "Confirmer ma demande — Axis Experts",
};

interface RequestRow {
  status: string;
  expires_at: string | null;
  confirmed_at: string | null;
  form_data: Record<string, unknown> | null;
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

function adresseFromRecap(lines: { label: string; value: string }[]): string {
  return lines.find((l) => l.label === "Adresse")?.value ?? "";
}

export default async function ConfirmerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data } = await admin
    .from("public_rdv_requests")
    .select("status, expires_at, confirmed_at, form_data")
    .eq("token", token)
    .maybeSingle<RequestRow>();

  const nowIso = new Date().toISOString();

  // Cas 1 — introuvable.
  if (!data) {
    return (
      <Shell>
        <div className={`${styles.card} ${styles.success}`}>
          <div className={styles.notice}>🔗</div>
          <h1>Lien invalide</h1>
          <p className={styles.lead}>
            Ce lien ne correspond à aucune demande. Vous pouvez faire une
            nouvelle demande de rendez-vous.
          </p>
          <a className={styles.cta} href="/prendre-rdv">
            Faire une nouvelle demande →
          </a>
        </div>
      </Shell>
    );
  }

  const recap = buildRecap(data.form_data ?? {});
  const adresse = adresseFromRecap(recap.lines);

  // Cas 2 — déjà confirmée (usage unique : recliquer ne refait rien).
  if (data.status === "confirmed") {
    return (
      <Shell>
        <div className={`${styles.card} ${styles.success}`}>
          <div className={styles.check}>✓</div>
          <h1>Demande déjà confirmée</h1>
          <p className={styles.lead}>
            Votre demande a déjà été confirmée. Nous vous recontactons
            rapidement pour vous proposer une date de rendez-vous.
          </p>
          <a
            className={styles.cta}
            href="https://www.axis-experts.be"
            target="_blank"
            rel="noopener noreferrer"
          >
            Retour au site Axis Experts →
          </a>
        </div>
      </Shell>
    );
  }

  // Cas 3 — expirée (statut 'expired' ou date dépassée).
  const isExpired =
    data.status === "expired" ||
    (data.expires_at != null && data.expires_at <= nowIso);
  if (isExpired) {
    return (
      <Shell>
        <div className={`${styles.card} ${styles.success}`}>
          <div className={styles.notice}>⏳</div>
          <h1>Lien expiré</h1>
          <p className={styles.lead}>
            Ce lien de confirmation n&apos;est plus valable. Merci de refaire
            une demande, nous vous renverrons un nouveau lien.
          </p>
          <a className={styles.cta} href="/prendre-rdv">
            Faire une nouvelle demande →
          </a>
        </div>
      </Shell>
    );
  }

  // Cas 4 — valide et 'pending' : récap + bouton de confirmation (au clic).
  if (data.status === "pending") {
    return (
      <Shell>
        <ConfirmClient
          token={token}
          missionLabel={recap.missionLabel}
          bienLabel={recap.bienLabel}
          adresse={adresse}
          price={recap.price}
        />
      </Shell>
    );
  }

  // Statut inattendu (ex. 'cancelled') -> message générique.
  return (
    <Shell>
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.notice}>🔗</div>
        <h1>Lien invalide</h1>
        <p className={styles.lead}>
          Ce lien n&apos;est plus utilisable. Vous pouvez faire une nouvelle
          demande de rendez-vous.
        </p>
        <a className={styles.cta} href="/prendre-rdv">
          Faire une nouvelle demande →
        </a>
      </div>
    </Shell>
  );
}
