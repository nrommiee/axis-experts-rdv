import { describe, expect, it } from "vitest";

import { parseRdvDate } from "./parseRdvDate";

describe("parseRdvDate", () => {
  it("retourne { null, null } pour null/undefined/chaîne vide", () => {
    expect(parseRdvDate(null)).toEqual({ date: null, time: null });
    expect(parseRdvDate(undefined)).toEqual({ date: null, time: null });
    expect(parseRdvDate("")).toEqual({ date: null, time: null });
  });

  it("retourne { null, null } pour un non-string", () => {
    expect(parseRdvDate(123)).toEqual({ date: null, time: null });
    expect(parseRdvDate(false)).toEqual({ date: null, time: null });
    expect(parseRdvDate({})).toEqual({ date: null, time: null });
  });

  it("parse le format nominal avec plage et timezone", () => {
    expect(
      parseRdvDate("17/04/2026 de (09:00:00 à 10:00:00) (Europe/Brussels)"),
    ).toEqual({ date: "17/04/2026", time: "09:00" });
  });

  it("parse une plage sans secondes", () => {
    expect(parseRdvDate("17/04/2026 de (09:00 à 10:00)")).toEqual({
      date: "17/04/2026",
      time: "09:00",
    });
  });

  it("parse une date seule sans plage horaire", () => {
    expect(parseRdvDate("17/04/2026")).toEqual({
      date: "17/04/2026",
      time: null,
    });
  });

  it("retourne { null, null } pour une valeur non conforme", () => {
    expect(parseRdvDate("N/A")).toEqual({ date: null, time: null });
    expect(parseRdvDate("À confirmer")).toEqual({ date: null, time: null });
  });

  it("retourne la date même si la partie plage est malformée", () => {
    expect(parseRdvDate("17/04/2026 quelque chose")).toEqual({
      date: "17/04/2026",
      time: null,
    });
  });
});
