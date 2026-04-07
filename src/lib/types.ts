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
  studio: "Studio",
  app1: "Appartement 1 chambre",
  app2: "Appartement 2 chambres",
  app3: "Appartement 3 chambres",
  app4: "Appartement 4 chambres",
  app5: "Appartement 5 chambres",
  maison: "Maison",
  bureau: "Bureau-Commerce",
};
