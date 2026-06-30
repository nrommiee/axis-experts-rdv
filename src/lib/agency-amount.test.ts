import { describe, it, expect } from "vitest";
import {
  ORDER_AMOUNT_FIELDS,
  selectOrderFields,
  stripOrderAmounts,
} from "./agency-amount";

const BASE_FIELDS = [
  "id",
  "name",
  "date_order",
  "amount_total",
  "state",
] as const;

describe("selectOrderFields", () => {
  it("retire les champs de montant pour une agence (jamais lus côté Odoo)", () => {
    const fields = selectOrderFields(BASE_FIELDS, "agency");
    expect(fields).not.toContain("amount_total");
    for (const f of ORDER_AMOUNT_FIELDS) {
      expect(fields).not.toContain(f);
    }
    // Les autres champs sont conservés, dans l'ordre.
    expect(fields).toEqual(["id", "name", "date_order", "state"]);
  });

  it("conserve le montant pour une organisation non-agence", () => {
    expect(selectOrderFields(BASE_FIELDS, "social")).toContain("amount_total");
    expect(selectOrderFields(BASE_FIELDS, "dactylo")).toContain("amount_total");
    expect(selectOrderFields(BASE_FIELDS, null)).toContain("amount_total");
  });
});

describe("stripOrderAmounts", () => {
  it("une réponse destinée à une agence ne contient PAS le champ montant", () => {
    const orders = [
      { id: 1, name: "S0001", amount_total: 1250.5, state: "sale" },
      { id: 2, name: "S0002", amount_total: 0, state: "draft" },
    ];
    const result = stripOrderAmounts(orders, "agency");
    for (const o of result) {
      expect("amount_total" in o).toBe(false);
      expect(o).not.toHaveProperty("amount_total");
    }
    // Les champs non-montant restent intacts.
    expect(result[0]).toMatchObject({ id: 1, name: "S0001", state: "sale" });
  });

  it("retire aussi amount_untaxed / amount_tax pour une agence", () => {
    const orders = [
      { id: 1, amount_total: 100, amount_untaxed: 80, amount_tax: 20 },
    ];
    const [o] = stripOrderAmounts(orders, "agency");
    expect(o).not.toHaveProperty("amount_total");
    expect(o).not.toHaveProperty("amount_untaxed");
    expect(o).not.toHaveProperty("amount_tax");
  });

  it("une réponse non-agence contient TOUJOURS le champ montant", () => {
    for (const type of ["social", "dactylo", null, undefined, ""] as const) {
      const orders = [{ id: 1, amount_total: 1250.5 }];
      const [o] = stripOrderAmounts(orders, type);
      expect(o).toHaveProperty("amount_total", 1250.5);
    }
  });
});
