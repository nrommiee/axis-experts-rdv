// Schéma de validation du payload de soumission publique de RDV.
// Validation STRICTE côté serveur — le serveur ne fait jamais confiance au
// client. Zod v4. Réutilisable par la page si besoin.

import { z } from "zod";

// Réutilise la validation de date YMD du portail (même règle "AAAA-MM-JJ").
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ymdString = z
  .string()
  .regex(YMD_REGEX, "Format de date invalide (AAAA-MM-JJ).");

const presence = z.enum(["oui", "non"]);

const partySchema = z.object({
  nom: z.string().max(120).optional().default(""),
  email: z.union([z.string().email().max(160), z.literal("")]).optional().default(""),
  tel: z.string().max(40).optional().default(""),
  present: presence.optional().default("oui"),
});

const supsSchema = z
  .object({
    meuble: z.number().int().min(0).max(50),
    jardin: z.number().int().min(0).max(50),
    sanitaire: z.number().int().min(0).max(50),
    garage: z.number().int().min(0).max(50),
    cave: z.number().int().min(0).max(50),
  })
  .partial()
  .optional();

const addressSchema = z.object({
  rue: z.string().min(1, "Rue requise.").max(160),
  num: z.string().max(20).optional().default(""),
  bte: z.string().max(20).optional().default(""),
  cp: z.string().min(1, "Code postal requis.").max(12),
  ville: z.string().min(1, "Ville requise.").max(80),
});

const availabilitySchema = z
  .object({
    dateDebut: z.union([ymdString, z.literal("")]).optional().default(""),
    dateFin: z.union([ymdString, z.literal("")]).optional().default(""),
    horaire: z.string().max(40).optional().default(""),
  })
  .optional();

const estimateSchema = z
  .object({
    ref: z.string().max(60).optional().default(""),
    perParty: z.number().nonnegative().optional(),
    total: z.number().nonnegative().optional(),
    devis: z.boolean().optional().default(false),
  })
  .optional();

const extrasSchema = z
  .object({
    eau: z.string().max(80).optional().default(""),
    note: z.string().max(2000).optional().default(""),
  })
  .partial()
  .optional();

export const publicRdvSchema = z
  .object({
    who: z.enum(["proprietaire", "locataire", "agence"]),
    ptype: z.enum(["phys", "soc"]).optional().default("phys"),
    mission: z.enum(["ELLE", "ELLS"]),
    propertyType: z.enum(["appartement", "maison", "studio", "kot"]),
    chambres: z.number().int().min(1).max(6),
    sups: supsSchema,

    // Demandeur — selon who/ptype, le front pose ici nom perso / raison sociale
    // / nom d'agence. Toujours requis + email destinataire.
    nom: z.string().min(1, "Le nom est requis.").max(120),
    email: z.string().email("Email invalide.").max(160),
    phone: z.string().max(40).optional().default(""),
    agCode: z.string().max(60).optional().default(""),
    // N° de TVA (sociétés) — format souple, optionnel.
    vat: z.string().max(40).optional().default(""),

    address: addressSchema,
    parties: z.object({ p1: partySchema, p2: partySchema }).optional(),
    availability: availabilitySchema,
    extras: extrasSchema,
    estimate: estimateSchema,

    // Consentement RGPD — DOIT être true.
    consent: z.literal(true, {
      message: "Le consentement au traitement des données est requis.",
    }),
  })
  .superRefine((value, ctx) => {
    // Code partenaire requis pour une agence.
    if (value.who === "agence" && !value.agCode.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["agCode"],
        message: "Le code partenaire est requis pour une agence.",
      });
    }
  });

export type PublicRdvInput = z.infer<typeof publicRdvSchema>;
