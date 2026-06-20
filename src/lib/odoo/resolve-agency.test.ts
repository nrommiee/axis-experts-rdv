import { describe, it, expect } from "vitest";
import {
  selectAgent,
  getParentId,
  validateParent,
  type AgentPartnerRecord,
} from "./resolve-agency";

const baseAgent: AgentPartnerRecord = {
  id: 42,
  name: "Agent Dupont",
  email: "agent@agence.be",
  is_company: false,
  parent_id: [7, "Agence SPRL"],
};

describe("selectAgent", () => {
  it("retourne NOT_FOUND quand aucune fiche", () => {
    const res = selectAgent([]);
    expect(res).toEqual({ ok: false, reason: "NOT_FOUND" });
  });

  it("retourne MULTIPLE_MATCHES quand plusieurs fiches (email ambigu)", () => {
    const res = selectAgent([baseAgent, { ...baseAgent, id: 43 }]);
    expect(res).toEqual({ ok: false, reason: "MULTIPLE_MATCHES" });
  });

  it("retourne la fiche unique quand un seul résultat", () => {
    const res = selectAgent([baseAgent]);
    expect(res).toEqual({ ok: true, agent: baseAgent });
  });
});

describe("getParentId", () => {
  it("extrait l'ID société depuis parent_id", () => {
    expect(getParentId(baseAgent)).toBe(7);
  });

  it("retourne null quand parent_id = false (sans parent)", () => {
    expect(getParentId({ ...baseAgent, parent_id: false })).toBeNull();
  });

  it("retourne null quand parent_id est absent", () => {
    expect(getParentId({ ...baseAgent, parent_id: undefined })).toBeNull();
  });
});

describe("validateParent", () => {
  it("succès quand le parent est une société", () => {
    const res = validateParent(baseAgent, { id: 7, is_company: true });
    expect(res).toEqual({ ok: true, agentContactId: 42, agencyId: 7 });
  });

  it("NO_PARENT quand l'agent n'a pas de parent", () => {
    const res = validateParent({ ...baseAgent, parent_id: false }, { id: 7, is_company: true });
    expect(res).toEqual({ ok: false, reason: "NO_PARENT" });
  });

  it("PARENT_NOT_COMPANY quand le parent n'est pas une société", () => {
    const res = validateParent(baseAgent, { id: 7, is_company: false });
    expect(res).toEqual({ ok: false, reason: "PARENT_NOT_COMPANY" });
  });

  it("PARENT_NOT_COMPANY quand le parent est introuvable", () => {
    const res = validateParent(baseAgent, null);
    expect(res).toEqual({ ok: false, reason: "PARENT_NOT_COMPANY" });
  });
});
