import { describe, expect, it } from "vitest";

import {
  RDV_HOUR_MAX,
  RDV_HOUR_MIN,
  RDV_MINUTE_STEP,
  RDV_TIMEZONE,
  formatRdvDateTimeFr,
  isDateValid,
  rdvDateSchema,
} from "./rdvDateSchema";

const NOW_CEST = new Date("2026-04-16T12:00:00+02:00");
const NOW_CET = new Date("2026-03-01T12:00:00+01:00");

describe("constantes", () => {
  it("expose les bornes attendues", () => {
    expect(RDV_HOUR_MIN).toBe(8);
    expect(RDV_HOUR_MAX).toBe(19);
    expect(RDV_MINUTE_STEP).toBe(30);
    expect(RDV_TIMEZONE).toBe("Europe/Brussels");
  });
});

describe("isDateValid", () => {
  it("rejette une date passée (hier)", () => {
    const result = isDateValid("2026-04-15T10:00:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/futur/i);
  });

  it("accepte une date future (demain 10h00)", () => {
    const result = isDateValid("2026-04-17T10:00:00+02:00", NOW_CEST);
    expect(result.ok).toBe(true);
  });

  it("rejette aujourd'hui avec une heure déjà passée", () => {
    const past = new Date("2026-04-16T14:00:00+02:00");
    const result = isDateValid("2026-04-16T10:00:00+02:00", past);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/futur/i);
  });

  it("accepte aujourd'hui avec une heure encore à venir", () => {
    const early = new Date("2026-04-16T08:30:00+02:00");
    const result = isDateValid("2026-04-16T10:00:00+02:00", early);
    expect(result.ok).toBe(true);
  });

  it("rejette 7h59 (hors bornes basses)", () => {
    const result = isDateValid("2026-04-17T07:59:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/08h00|19h00/);
  });

  it("rejette 19h01 (hors bornes hautes)", () => {
    const result = isDateValid("2026-04-17T19:01:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/08h00|19h00/);
  });

  it("accepte 8h00 pile (borne inclusive)", () => {
    const result = isDateValid("2026-04-17T08:00:00+02:00", NOW_CEST);
    expect(result.ok).toBe(true);
  });

  it("accepte 19h00 pile (borne inclusive)", () => {
    const result = isDateValid("2026-04-17T19:00:00+02:00", NOW_CEST);
    expect(result.ok).toBe(true);
  });

  it("rejette minutes 15 (non multiple de 30)", () => {
    const result = isDateValid("2026-04-17T10:15:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/30 minutes/);
  });

  it("rejette minutes 45 (non multiple de 30)", () => {
    const result = isDateValid("2026-04-17T10:45:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/30 minutes/);
  });

  it("rejette un format non-ISO", () => {
    const result = isDateValid("pas une date", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/format/i);
  });

  it("rejette une string vide", () => {
    const result = isDateValid("", NOW_CEST);
    expect(result.ok).toBe(false);
  });

  it("accepte une heure valide avant la transition DST (CET, UTC+1)", () => {
    const result = isDateValid("2026-03-15T10:30:00+01:00", NOW_CET);
    expect(result.ok).toBe(true);
  });

  it("accepte la même heure en horaire d'été (CEST, UTC+2) après transition", () => {
    const result = isDateValid("2026-04-15T10:30:00+02:00", NOW_CET);
    expect(result.ok).toBe(true);
  });

  it("rejette l'heure d'un lundi 7h30 CEST (hors bornes même en été)", () => {
    const result = isDateValid("2026-04-20T07:30:00+02:00", NOW_CEST);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toMatch(/08h00/);
  });
});

describe("rdvDateSchema", () => {
  it("parse une date future valide", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    future.setUTCHours(8, 0, 0, 0);
    const iso = future.toISOString();
    // May need to check that hour in Brussels is in range — choose 10h local UTC
    // to be safe across both DST and non-DST (10h UTC = 11h/12h local)
    future.setUTCHours(10, 0, 0, 0);
    const parsed = rdvDateSchema.safeParse(future.toISOString());
    expect(parsed.success).toBe(true);
    void iso;
  });

  it("rejette avec message en français une date invalide", () => {
    const parsed = rdvDateSchema.safeParse("pas une date");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/format/i);
    }
  });

  it("rejette une string vide avec message explicite", () => {
    const parsed = rdvDateSchema.safeParse("");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBeDefined();
    }
  });

  it("rejette un input non-string", () => {
    const parsed = rdvDateSchema.safeParse(123);
    expect(parsed.success).toBe(false);
  });
});

describe("formatRdvDateTimeFr", () => {
  it("formate une date ISO en français complet", () => {
    // 2026-04-23 14:30 Brussels (CEST, UTC+2) → 12:30 UTC
    const formatted = formatRdvDateTimeFr("2026-04-23T14:30:00+02:00");
    expect(formatted).toMatch(/jeudi/i);
    expect(formatted).toMatch(/23 avril 2026/);
    expect(formatted).toMatch(/14h30/);
  });

  it("retourne une chaîne vide pour un format invalide", () => {
    expect(formatRdvDateTimeFr("invalid")).toBe("");
  });

  it("formate correctement en hiver (CET)", () => {
    const formatted = formatRdvDateTimeFr("2026-01-15T09:00:00+01:00");
    expect(formatted).toMatch(/15 janvier 2026/);
    expect(formatted).toMatch(/09h00/);
  });
});
