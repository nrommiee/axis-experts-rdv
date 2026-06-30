import { describe, expect, it } from "vitest";
import { withCreatorForAgency } from "./notification-recipients";

// Lot 4a — confirmation date/heure du RDV au DEMANDEUR.
// `withCreatorForAgency` est la composition pure qui décide si le demandeur
// (déjà résolu via portal_submissions par l'appelant) est ajouté aux
// destinataires. Le détail « préférence désactivée → aucun envoi » est gardé en
// amont par `shouldSendRdvNotification` (cf. notification-preferences.test.ts) :
// le cron n'atteint cette composition que si la préférence est active.
describe("withCreatorForAgency", () => {
  it("ajoute le demandeur aux destinataires pour une organisation agence", () => {
    const result = withCreatorForAgency(
      ["agence@exemple.test"],
      "agency",
      "demandeur@exemple.test"
    );
    expect(result).toContain("demandeur@exemple.test");
    expect(result).toContain("agence@exemple.test");
  });

  it("n'ajoute PAS le demandeur pour un flux non-agence (inchangé)", () => {
    for (const clientType of ["social", "dactylo", null, undefined]) {
      const result = withCreatorForAgency(
        ["org@exemple.test"],
        clientType,
        "demandeur@exemple.test"
      );
      expect(result).toEqual(["org@exemple.test"]);
      expect(result).not.toContain("demandeur@exemple.test");
    }
  });

  it("ne crée pas de doublon si le demandeur figure déjà dans la liste de base", () => {
    const result = withCreatorForAgency(
      ["Demandeur@Exemple.test", "agence@exemple.test"],
      "agency",
      "demandeur@exemple.test"
    );
    expect(result.filter((e) => e === "demandeur@exemple.test")).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it("agence sans demandeur résolu → liste de base normalisée, inchangée", () => {
    const result = withCreatorForAgency(
      ["Agence@Exemple.test"],
      "agency",
      null
    );
    expect(result).toEqual(["agence@exemple.test"]);
  });

  it("normalise et déduplique le résultat final", () => {
    const result = withCreatorForAgency(
      ["  AGENCE@exemple.test  ", "agence@exemple.test"],
      "agency",
      "  Demandeur@Exemple.test  "
    );
    expect(result.sort()).toEqual(
      ["agence@exemple.test", "demandeur@exemple.test"].sort()
    );
  });
});
