import { describe, expect, it } from "vitest";

import { formatDeliveryPartnerName } from "./format-delivery-partner-name";

describe("formatDeliveryPartnerName", () => {
  it("assemble le cas complet au format CP VILLE, RUE, NUMERO, BOÎTE", () => {
    expect(
      formatDeliveryPartnerName({
        rue: "Avenue Ariane",
        numero: "4",
        boite: "Apt 511",
        codePostal: "1200",
        ville: "Woluwé",
      })
    ).toBe("1200 Woluwé, Avenue Ariane, 4, Apt 511");
  });

  it("omet la boîte quand elle est vide (pas de virgule orpheline)", () => {
    expect(
      formatDeliveryPartnerName({
        rue: "Avenue Ariane",
        numero: "4",
        boite: "",
        codePostal: "1200",
        ville: "Woluwé",
      })
    ).toBe("1200 Woluwé, Avenue Ariane, 4");
  });

  it("omet le numéro quand il est vide", () => {
    expect(
      formatDeliveryPartnerName({
        rue: "Avenue Ariane",
        numero: "",
        boite: "",
        codePostal: "1200",
        ville: "Woluwé",
      })
    ).toBe("1200 Woluwé, Avenue Ariane");
  });

  it("omet le segment CP VILLE quand CP et ville sont vides", () => {
    expect(
      formatDeliveryPartnerName({
        rue: "Avenue Ariane",
        numero: "4",
        boite: "Apt 511",
        codePostal: "",
        ville: "",
      })
    ).toBe("Avenue Ariane, 4, Apt 511");
  });

  it("ne produit jamais 'undefined' ni de virgule orpheline", () => {
    expect(
      formatDeliveryPartnerName({
        rue: "Avenue Ariane",
        numero: undefined,
        boite: null,
        codePostal: "1200",
        ville: undefined,
      })
    ).toBe("1200, Avenue Ariane");
  });
});
