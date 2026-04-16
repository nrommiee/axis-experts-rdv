import { describe, expect, it } from "vitest";

import {
  RDV_MAX_RANGE_DAYS,
  RDV_TIMEZONE,
  formatRdvDateRangeFr,
  isDateRangeValid,
  rdvDateRangeSchema,
} from "./rdvDateSchema";

const NOW = new Date("2026-04-16T12:00:00+02:00");

describe("constantes", () => {
  it("expose les valeurs attendues", () => {
    expect(RDV_TIMEZONE).toBe("Europe/Brussels");
    expect(RDV_MAX_RANGE_DAYS).toBe(30);
  });
});

describe("isDateRangeValid", () => {
  it("rejette une date de début passée (hier)", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-15", dateFin: "2026-04-20" },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/futur/i);
  });

  it("accepte une fourchette d'un seul jour à aujourd'hui", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-16", dateFin: "2026-04-16" },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("accepte une fourchette demain → dans 10 jours", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-17", dateFin: "2026-04-27" },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("rejette si dateFin < dateDebut", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-20", dateFin: "2026-04-17" },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/postérieure|égale/i);
  });

  it("rejette une fourchette de plus de 30 jours", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-17", dateFin: "2026-05-18" },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/30 jours/);
  });

  it("accepte une fourchette de 30 jours pile", () => {
    const result = isDateRangeValid(
      { dateDebut: "2026-04-17", dateFin: "2026-05-17" },
      NOW,
    );
    expect(result.ok).toBe(true);
  });

  it("rejette un format de date invalide", () => {
    const result = isDateRangeValid(
      { dateDebut: "pas une date", dateFin: "2026-04-20" },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/format/i);
  });

  it("rejette une string vide", () => {
    const result = isDateRangeValid({ dateDebut: "", dateFin: "" }, NOW);
    expect(result.ok).toBe(false);
  });
});

describe("rdvDateRangeSchema", () => {
  it("parse une fourchette valide", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const ymd = future.toISOString().slice(0, 10);
    const parsed = rdvDateRangeSchema.safeParse({
      dateDebut: ymd,
      dateFin: ymd,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejette une fourchette dans le passé avec message en français", () => {
    const parsed = rdvDateRangeSchema.safeParse({
      dateDebut: "2000-01-01",
      dateFin: "2000-01-02",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/futur/i);
    }
  });

  it("rejette un payload sans dateDebut", () => {
    const parsed = rdvDateRangeSchema.safeParse({ dateFin: "2026-04-17" });
    expect(parsed.success).toBe(false);
  });
});

describe("formatRdvDateRangeFr", () => {
  it("formate une fourchette multi-jours au format 'du X au Y'", () => {
    const out = formatRdvDateRangeFr({
      dateDebut: "2026-04-21",
      dateFin: "2026-04-26",
    });
    expect(out).toMatch(/^du /);
    expect(out).toMatch(/mardi 21 avril/i);
    expect(out).toMatch(/dimanche 26 avril 2026/i);
  });

  it("formate une fourchette d'un seul jour en 'le X'", () => {
    const out = formatRdvDateRangeFr({
      dateDebut: "2026-04-21",
      dateFin: "2026-04-21",
    });
    expect(out).toBe(`le ${out.replace(/^le /, "")}`);
    expect(out).toMatch(/mardi 21 avril 2026/i);
  });

  it("gère une transition DST sans planter", () => {
    // Dernier dimanche de mars 2026 = 29 mars
    const out = formatRdvDateRangeFr({
      dateDebut: "2026-03-28",
      dateFin: "2026-03-30",
    });
    expect(out).toMatch(/28 mars/);
    expect(out).toMatch(/30 mars 2026/);
  });

  it("retourne vide pour un format invalide", () => {
    expect(
      formatRdvDateRangeFr({ dateDebut: "bad", dateFin: "bad" }),
    ).toBe("");
  });

  it("affiche juste le jour quand dateFin absent", () => {
    const out = formatRdvDateRangeFr({
      dateDebut: "2026-04-21",
      dateFin: null,
    });
    expect(out).toMatch(/^le mardi 21 avril 2026/i);
  });
});
