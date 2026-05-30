"use client";

import { useState } from "react";
import styles from "../../confirmer.module.css";

// Validation de présence AU CLIC (anti pré-chargement mail). POST puis bascule
// sur l'écran de succès. Idempotent (confirmed/already -> succès).

type View = "form" | "success" | "invalid";

export default function ValidateClient({
  token,
  partyLabel,
  dateLabel,
}: {
  token: string;
  partyLabel: string;
  dateLabel: string;
}) {
  const [view, setView] = useState<View>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/rdv/validate", {
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
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.check}>✓</div>
        <h1>Présence confirmée</h1>
        <p className={styles.lead}>
          Merci, votre présence est bien enregistrée. Pour toute modification,
          contactez-nous au 02 880 90 90 ou à info@axis-experts.be.
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
    );
  }

  if (view === "invalid") {
    return (
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.notice}>🔗</div>
        <h1>Lien invalide</h1>
        <p className={styles.lead}>
          Ce lien ne correspond à aucune demande de validation. Pour toute
          question, contactez-nous au 02 880 90 90 ou à info@axis-experts.be.
        </p>
      </div>
    );
  }

  // view === "form"
  const recap: { label: string; value: string }[] = [];
  if (dateLabel) recap.push({ label: "Date proposée", value: dateLabel });
  if (partyLabel) recap.push({ label: "Vous validez en tant que", value: partyLabel });

  return (
    <div className={styles.card}>
      <h1>Confirmez votre présence</h1>
      <p className={styles.lead}>
        Une date de rendez-vous a été proposée pour l&apos;état des lieux. Merci
        de confirmer votre présence ci-dessous.
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
      <button
        type="button"
        className={styles.cta}
        onClick={confirm}
        disabled={submitting}
      >
        {submitting ? "Confirmation…" : "Je confirme ma présence →"}
      </button>
      {error && <div className={styles.errBox}>{error}</div>}
      <p className={styles.sub}>
        Pour modifier ou en cas d&apos;empêchement, contactez-nous au{" "}
        <b>02 880 90 90</b> ou à <b>info@axis-experts.be</b>.
      </p>
    </div>
  );
}
