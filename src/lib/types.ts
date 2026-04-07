export interface FormData {
  // Step 1 - Mission
  typeMission: "entree" | "sortie" | "";
  typeBien: string;
  rue: string;
  numero: string;
  boite: string;
  codePostal: string;
  commune: string;
  dateDebut: string;
  dateFin: string;

  // Step 2 - Parties
  bailleurSociete: string;
  bailleurNom: string;
  bailleurPrenom: string;
  bailleurEmail: string;
  bailleurTelephone: string;
  locataireNom: string;
  locatairePrenom: string;
  locataireEmail: string;
  locataireTelephone: string;

  // Step 3 - Documents
  bail: File | null;
  edlEntree: File | null;
}

export const TYPES_BIEN = [
  { value: "studio", label: "Studio" },
  { value: "app1", label: "App 1ch" },
  { value: "app2", label: "App 2ch" },
  { value: "app3", label: "App 3ch" },
  { value: "app4", label: "App 4ch" },
  { value: "app5", label: "App 5ch" },
  { value: "maison", label: "Maison" },
  { value: "bureau", label: "Bureau-Commerce" },
] as const;

export const TYPE_BIEN_ODOO_MAP: Record<string, string> = {
  studio: "A0",
  app1: "A1CH",
  app2: "A2CH",
  app3: "A3CH",
  app4: "A4CH",
  app5: "A5CH",
  maison: "Maison",
  bureau: "Bureau",
};
