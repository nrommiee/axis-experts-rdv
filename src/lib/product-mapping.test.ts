import { describe, expect, it } from "vitest";

import {
  mapProductName,
  isOption,
  deriveDisplayLabel,
  deriveOptionFromCode,
  type ProductConfig,
} from "./product-mapping";

describe("config-based mapping (social clients — unchanged)", () => {
  const config: ProductConfig = {
    optionKeys: ["EDL_OPT_FR"],
    labelMap: { EDL_ELE_A0: "Studio - entrée" },
  };

  it("maps the label from labelMap, falls back to code", () => {
    expect(mapProductName("EDL_ELE_A0", config)).toBe("Studio - entrée");
    expect(mapProductName("EDL_ELE_A1", config)).toBe("EDL_ELE_A1");
  });

  it("flags options from optionKeys", () => {
    expect(isOption("EDL_OPT_FR", config)).toBe(true);
    expect(isOption("EDL_ELE_A0", config)).toBe(false);
  });
});

describe("config-less derivation (agencies — live AXIS catalog)", () => {
  it("derives option status from the _OPT_ marker", () => {
    expect(deriveOptionFromCode("AXIS_OPT_FR")).toBe(true);
    expect(deriveOptionFromCode("AXIS_OPT_METRE")).toBe(true);
    expect(deriveOptionFromCode("AXIS_ELLE_A0")).toBe(false);
    expect(deriveOptionFromCode("AXIS_ELLS_K")).toBe(false);
  });

  it("uses the live Odoo name as label, falling back to the code", () => {
    expect(deriveDisplayLabel("AXIS_ELLE_A0", "Studio - entrée")).toBe("Studio - entrée");
    expect(deriveDisplayLabel("AXIS_ELLE_A0", "  ")).toBe("AXIS_ELLE_A0");
    expect(deriveDisplayLabel("AXIS_ELLE_A0", null)).toBe("AXIS_ELLE_A0");
    expect(deriveDisplayLabel("AXIS_ELLE_A0", undefined)).toBe("AXIS_ELLE_A0");
  });
});
