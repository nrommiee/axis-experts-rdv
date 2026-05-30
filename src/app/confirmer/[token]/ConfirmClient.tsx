"use client";

import { useState } from "react";
import styles from "../confirmer.module.css";
import type { RecapLine } from "@/lib/public-rdv/recap";

// Bouton de confirmation : POST /api/public/rdv/confirm puis bascule sur l'écran
// de succès (état 1 -> état 2 de la maquette). Idempotent côté UX : "confirmed"
// et "already" affichent tous deux le succès.

type View = "form" | "success" | "expired" | "invalid";

export default function ConfirmClient({
  token,
  missionLabel,
  bienLabel,
  adresse,
  price,
}: {
  token: string;
  missionLabel: string;
  bienLabel: string;
  adresse: string;
  price: { perParty: number; total: number } | null;
}) {
  const [view, setView] = useState<View>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/rdv/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => null)) as {
        status?: string;
        error?: string;
      } | null;

      if (res.ok && data) {
        if (data.status === "confirmed" || data.status === "already") {
          setView("success");
        } else if (data.status === "expired") {
          setView("expired");
        } else {
          setView("invalid");
        }
        return;
      }

      if (res.status === 429) {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else {
        setError(
          (data && data.error) ||
            "La confirmation a échoué. Réessayez dans un instant."
        );
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "success") {
    const recap: RecapLine[] = [];
    if (missionLabel)
      recap.push({
        label: "Mission",
        value: bienLabel ? `${missionLabel} · ${bienLabel}` : missionLabel,
      });
    if (adresse) recap.push({ label: "Adresse", value: adresse });
    recap.push({ label: "Statut", value: "Demande reçue" });

    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.check}>✓</div>
        <h1>Votre demande est confirmée</h1>
        <p className={styles.lead}>
          Merci, votre demande est bien enregistrée. Nous vous recontactons
          rapidement pour vous proposer une date de rendez-vous.
        </p>
        <div className={styles.recap}>
          {recap.map((l) => (
            <div className={styles.rrow} key={l.label}>
              <span>{l.label}</span>
              <b>{l.value}</b>
            </div>
          ))}
        </div>
        <a
          className={styles.cta}
          href="https://www.axis-experts.be"
          target="_blank"
          rel="noopener noreferrer"
        >
          Retour au site Axis Experts →
        </a>
      </div>
    );
  }

  if (view === "expired") {
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.notice}>⏳</div>
        <h1>Lien expiré</h1>
        <p className={styles.lead}>
          Ce lien de confirmation n&apos;est plus valable. Merci de refaire une
          demande, nous vous renverrons un nouveau lien.
        </p>
        <a className={styles.cta} href="/prendre-rdv">
          Faire une nouvelle demande →
        </a>
      </div>
    );
  }

  if (view === "invalid") {
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.notice}>🔗</div>
        <h1>Lien invalide</h1>
        <p className={styles.lead}>
          Ce lien ne correspond à aucune demande. Vous pouvez faire une nouvelle
          demande de rendez-vous.
        </p>
        <a className={styles.cta} href="/prendre-rdv">
          Faire une nouvelle demande →
        </a>
      </div>
    );
  }

  // view === "form" : récap + bouton de confirmation (confirmation au CLIC).
  const recap: RecapLine[] = [];
  if (missionLabel) recap.push({ label: "Mission", value: missionLabel });
  if (bienLabel) recap.push({ label: "Bien", value: bienLabel });
  if (adresse) recap.push({ label: "Adresse", value: adresse });

  return (
    <div className={styles.card}>
      <h1>Confirmez votre demande</h1>
      <p className={styles.lead}>
        Voici le récapitulatif de votre demande de rendez-vous. Vérifiez que
        tout est correct, puis confirmez.{" "}
        <b>Tant que vous n&apos;avez pas confirmé, votre demande n&apos;est pas
        enregistrée.</b>
      </p>
      {recap.length > 0 && (
        <div className={styles.recap}>
          {recap.map((l) => (
            <div className={styles.rrow} key={l.label}>
              <span>{l.label}</span>
              <b>{l.value}</b>
            </div>
          ))}
        </div>
      )}
      {price && (
        <div className={styles.price}>
          <div className={styles.prow}>
            <span>Honoraires bailleur</span>
            <span>{price.perParty} € TVAC</span>
          </div>
          <div className={styles.prow}>
            <span>Honoraires locataire</span>
            <span>{price.perParty} € TVAC</span>
          </div>
          <div className={styles.ptot}>
            <span>Total</span>
            <span>{price.total} € TVAC</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className={styles.cta}
        onClick={confirm}
        disabled={submitting}
      >
        {submitting ? "Confirmation…" : "Confirmer ma demande →"}
      </button>
      {error && <div className={styles.errBox}>{error}</div>}
      <p className={styles.sub}>
        Ce n&apos;est pas vous ? Ignorez simplement ce message.
      </p>
      <p className={styles.mention}>
        Prix indicatif TVAC (TVA 21 % comprise). En cas d&apos;écart avec la
        configuration réelle du bien constatée sur place, Axis Experts se
        réserve le droit de recalculer les honoraires.
      </p>
    </div>
  );
}
