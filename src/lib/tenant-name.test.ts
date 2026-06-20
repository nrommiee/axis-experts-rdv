import { describe, it, expect } from "vitest";
import { isTenantNameRequired } from "./tenant-name";

describe("isTenantNameRequired", () => {
  it("est obligatoire par défaut quand le flag est absent (rétrocompatible)", () => {
    expect(isTenantNameRequired(undefined)).toBe(true);
    expect(isTenantNameRequired(null)).toBe(true);
  });

  it("est obligatoire quand le flag vaut true", () => {
    expect(isTenantNameRequired(true)).toBe(true);
  });

  it("est optionnel UNIQUEMENT quand le flag vaut false explicite", () => {
    expect(isTenantNameRequired(false)).toBe(false);
  });
});
