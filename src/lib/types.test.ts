import { describe, expect, it } from "vitest";

import { getTypeBienFromDefaultCode, TYPE_BIEN_ODOO_MAP } from "./types";

describe("getTypeBienFromDefaultCode", () => {
  it("maps studio / appartement codes (A0..A5)", () => {
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_A0")).toBe("A0");
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_A1")).toBe("A1CH");
    expect(getTypeBienFromDefaultCode("AXIS_ELLS_A5")).toBe("A5CH");
  });

  it("maps house codes (_M1.._M5) to Maison", () => {
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_M1")).toBe("Maison");
    expect(getTypeBienFromDefaultCode("AXIS_ELLS_M3")).toBe(TYPE_BIEN_ODOO_MAP.maison);
  });

  it("maps kot codes (_K, _K0, _KOT) to Kot — not the A0 fallback", () => {
    // Code AXIS réel : la taille kot est encodée par `_K`.
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_K")).toBe("Kot");
    expect(getTypeBienFromDefaultCode("AXIS_ELLS_K")).toBe("Kot");
    // Variantes tolérées.
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_K0")).toBe("Kot");
    expect(getTypeBienFromDefaultCode("EDL_ELS_KOT")).toBe("Kot");
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_K_FR")).toBe("Kot");
  });

  it("does not confuse non-kot codes containing K with a kot", () => {
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_A1")).not.toBe("Kot");
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_M2")).not.toBe("Kot");
  });

  it("maps bureau / commerce codes", () => {
    expect(getTypeBienFromDefaultCode("AXIS_ELLE_Bureau")).toBe("Bureau");
  });

  it("falls back to A0 for unknown codes", () => {
    expect(getTypeBienFromDefaultCode("UNKNOWN_CODE")).toBe("A0");
  });
});
