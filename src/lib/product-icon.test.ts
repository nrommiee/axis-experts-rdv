import { describe, expect, it } from "vitest";
import { Building2, Home, Bed, Store, Warehouse } from "lucide-react";

import { getProductIcon, getRoomCount } from "./product-icon";

describe("getProductIcon", () => {
  it("returns Bed for studio / kot codes", () => {
    expect(getProductIcon("EDL_ELE_A0")).toBe(Bed);
    expect(getProductIcon("EDL_ELS_KOT")).toBe(Bed);
    expect(getProductIcon("STUDIO_BASE")).toBe(Bed);
  });

  it("returns Building2 for apartments _A1.._A9", () => {
    expect(getProductIcon("EDL_ELE_A1")).toBe(Building2);
    expect(getProductIcon("EDL_ELE_A2")).toBe(Building2);
    expect(getProductIcon("EDL_ELS_A5")).toBe(Building2);
  });

  it("returns Home for houses (_M1.._M9 or MAISON)", () => {
    expect(getProductIcon("SB_EDL_ELE_M1")).toBe(Home);
    expect(getProductIcon("SB_EDL_ELS_M3")).toBe(Home);
    expect(getProductIcon("MAISON_BASE")).toBe(Home);
  });

  it("returns Store for BUREAU / BUR.COM", () => {
    expect(getProductIcon("EDL_BUREAU")).toBe(Store);
    expect(getProductIcon("BUR.COM_ELE")).toBe(Store);
  });

  it("returns Warehouse for COMMUNS", () => {
    expect(getProductIcon("EDL_COMMUNS")).toBe(Warehouse);
  });

  it("falls back to Building2 for unknown codes", () => {
    expect(getProductIcon("UNKNOWN_CODE_XYZ")).toBe(Building2);
    expect(getProductIcon("")).toBe(Building2);
  });
});

describe("getRoomCount", () => {
  it("extracts the chamber count from _AN / _MN codes", () => {
    expect(getRoomCount("EDL_ELE_A1")).toBe(1);
    expect(getRoomCount("EDL_ELE_A5")).toBe(5);
    expect(getRoomCount("SB_EDL_ELE_M3")).toBe(3);
  });

  it("returns null when no chamber suffix is present", () => {
    expect(getRoomCount("EDL_ELE_KOT")).toBeNull();
    expect(getRoomCount("MAISON_BASE")).toBeNull();
    expect(getRoomCount("UNKNOWN")).toBeNull();
  });

  it("returns null for _A0 (studio, no rooms)", () => {
    expect(getRoomCount("EDL_ELE_A0")).toBeNull();
  });
});
