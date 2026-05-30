import Link from "next/link";
import styles from "../prendre-rdv.module.css";

// Écran "demande ENVOYÉE" (pas encore confirmée). À ne pas confondre avec la
// future page /confirmer/[token] (demande confirmée). Page serveur statique :
// pas d'état, s'affiche correctement même en accès direct. Couvert par
// l'exemption proxy /prendre-rdv déjà en place.

const LOGO_URL =
  "https://axis-experts.be/wp-content/uploads/2022/12/Axis-Logo-01.png";

export const metadata = {
  title: "Demande envoyée — Axis Experts",
};

export default function MerciPage() {
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
        </div>
      </header>

      <div className={styles.thanksPage}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h1>Votre demande a bien été envoyée</h1>
          <p className={styles.thanksLead}>
            Un email vient de partir vers votre adresse. Cliquez le lien
            qu&apos;il contient pour <b>confirmer votre demande</b> — elle ne
            sera prise en compte qu&apos;à ce moment-là.
          </p>
          <div className={styles.thanksHint}>
            📩 Pensez à vérifier vos spams si vous ne le voyez pas dans quelques
            minutes.
          </div>
          <p className={styles.thanksClose}>
            Vous pouvez maintenant fermer cette page.
          </p>
          <a
            className={styles.thanksBtn}
            href="https://www.axis-experts.be"
            target="_blank"
            rel="noopener noreferrer"
          >
            Retour au site Axis Experts →
          </a>
          <Link className={styles.thanksNew} href="/prendre-rdv">
            Faire une nouvelle demande
          </Link>
        </div>
      </div>
    </div>
  );
}
