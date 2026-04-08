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

  // New address (sortie only)
  locataireNewRue: string;
  locataireNewNumero: string;
  locataireNewBoite: string;
  locataireNewCodePostal: string;
  locataireNewCommune: string;

  // Step 2 - Représentant locataire
  representantEnabled: boolean;
  representantPrenom: string;
  representantNom: string;
  representantRole: string;
  representantEmail: string;
  representantTelephone: string;

  // Step 3 - Documents
  documents: DocumentFile[];

  // Step 4 - Informations
  locataireDecede: boolean;
  numeroPO: string;
  notesLibres: string;
  compteurEau: string;
  compteurGaz: string;
  compteurElec: string;
}

export interface DocumentFile {
  file: File;
  customName: string;
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

export function getTypeBienFromDefaultCode(defaultCode: string): string {
  if (defaultCode.includes('_A0')) return 'A0';
  if (defaultCode.includes('_A1')) return 'A1CH';
  if (defaultCode.includes('_A2')) return 'A2CH';
  if (defaultCode.includes('_A3')) return 'A3CH';
  if (defaultCode.includes('_A4')) return 'A4CH';
  if (defaultCode.includes('_A5')) return 'A5CH';
  if (defaultCode.includes('Maison') || defaultCode.includes('maison')) return 'Maison';
  if (defaultCode.includes('Bur') || defaultCode.includes('bureau')) return 'Bureau';
  if (defaultCode.includes('COMMUNS')) return 'A0';
  return 'A0';
}
