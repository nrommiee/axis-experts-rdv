import { z } from "zod";

/**
 * Extraction de bail (agence) — types partagés client/serveur.
 *
 * Le schéma est calqué EXACTEMENT sur les noms d'état du formulaire de demande.
 * Tous les champs sont des chaînes, tous requis, valeur par défaut "" (champ absent
 * du bail = chaîne vide, jamais inventé). additionalProperties:false côté JSON Schema.
 *
 * Aucun appel API ici : ce module ne contient que des types et la consigne.
 */

export const bailExtractionSchema = z.object({
  proprietaire: z.object({
    nom: z.string(),
    prenom: z.string(),
    societe: z.string(),
    email: z.string(),
    telephone: z.string(),
  }),
  locataire: z.object({
    nom: z.string(),
    prenom: z.string(),
    email: z.string(),
    telephone: z.string(),
  }),
  adresseBien: z.object({
    rue: z.string(),
    numero: z.string(),
    boite: z.string(),
    codePostal: z.string(),
    ville: z.string(),
  }),
});

export type BailExtraction = z.infer<typeof bailExtractionSchema>;

/**
 * JSON Schema (structured outputs) — passé tel quel à l'API Claude via
 * output_config.format. Tous champs string, tous required, additionalProperties:false.
 */
export const bailExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["proprietaire", "locataire", "adresseBien"],
  properties: {
    proprietaire: {
      type: "object",
      additionalProperties: false,
      required: ["nom", "prenom", "societe", "email", "telephone"],
      properties: {
        nom: { type: "string" },
        prenom: { type: "string" },
        societe: { type: "string" },
        email: { type: "string" },
        telephone: { type: "string" },
      },
    },
    locataire: {
      type: "object",
      additionalProperties: false,
      required: ["nom", "prenom", "email", "telephone"],
      properties: {
        nom: { type: "string" },
        prenom: { type: "string" },
        email: { type: "string" },
        telephone: { type: "string" },
      },
    },
    adresseBien: {
      type: "object",
      additionalProperties: false,
      required: ["rue", "numero", "boite", "codePostal", "ville"],
      properties: {
        rue: { type: "string" },
        numero: { type: "string" },
        boite: { type: "string" },
        codePostal: { type: "string" },
        ville: { type: "string" },
      },
    },
  },
} as const;

/** Consigne (bloc texte placé APRÈS le document dans le message user). */
export const BAIL_EXTRACTION_INSTRUCTION =
  "Extrais uniquement les champs présents dans le bail. Si une info est absente, renvoie une chaîne vide. Ne renvoie que le JSON.";

/** Valeur vide normalisée — utile côté client en cas d'échec partiel. */
export const EMPTY_BAIL_EXTRACTION: BailExtraction = {
  proprietaire: { nom: "", prenom: "", societe: "", email: "", telephone: "" },
  locataire: { nom: "", prenom: "", email: "", telephone: "" },
  adresseBien: { rue: "", numero: "", boite: "", codePostal: "", ville: "" },
};
