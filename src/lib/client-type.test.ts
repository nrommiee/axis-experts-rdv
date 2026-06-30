import { describe, it, expect } from "vitest";
import { isAgency } from "./client-type";

describe("isAgency", () => {
  it("est vrai uniquement pour la valeur exacte 'agency'", () => {
    expect(isAgency("agency")).toBe(true);
  });

  it("est faux pour les autres types d'organisation", () => {
    expect(isAgency("social")).toBe(false);
    expect(isAgency("dactylo")).toBe(false);
  });

  it("est faux pour les valeurs absentes ou vides (défaut non-agence)", () => {
    expect(isAgency(null)).toBe(false);
    expect(isAgency(undefined)).toBe(false);
    expect(isAgency("")).toBe(false);
  });
});
