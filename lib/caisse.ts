// Caisse solidaire RRTE : constantes et petits outils partagés par les pages /caisse.

export const MONTANT_MENSUEL = 2000; // FCFA par mois
export const DEBUT_CAISSE = new Date("2027-01-01T00:00:00");
// Numéro dédié à la caisse (Orange Money) et nom du titulaire : à renseigner quand le numéro est choisi.
export const NUMERO_CAISSE = "";
export const TITULAIRE_CAISSE = "";

export const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Rythmes de paiement proposés : le membre choisit combien de mois il règle d'un coup. */
export const RYTHMES = [
  { mois: 1, label: "Chaque mois" },
  { mois: 2, label: "Tous les 2 mois" },
  { mois: 3, label: "Chaque trimestre" },
  { mois: 6, label: "Chaque semestre" },
  { mois: 12, label: "Une fois par an" },
];

export const CATEGORIES_DEPENSE = [
  "Activité du groupe",
  "Aide sociale",
  "Application (hébergement, outils)",
  "Nom de domaine",
  "Communication",
  "Frais de gestion de la caisse",
  "Autre",
];

export interface Cotisation {
  id: string;
  recu?: string;
  empreinte?: string;
  moisApres?: number;
  valideLe?: { seconds: number } | null;
  uid: string;
  nom: string;
  annee: number;
  nbMois: number;
  montant: number;
  rythme: string;
  reference?: string;
  capture?: string;
  statut: "en_attente" | "valide" | "refuse" | "annule";
  motifRefus?: string;
  creeLe?: { seconds: number } | null;
}

export interface Cotisant {
  uid: string;
  nom: string;
  prenom: string;
  annee: number;
  moisCouverts: number;
}

export interface Depense {
  id: string;
  date: string;
  libelle: string;
  categorie: string;
  montant: number;
  saisiPar?: string;
  saisiUid?: string;
  aJustificatif?: boolean;
  statut?: "validee" | "a_approuver";
  annulee?: boolean;
  motifAnnulation?: string;
  approuveNom?: string;
}

export interface Totaux {
  encaisse: number;
  depense: number;
}

/** « 24 000 FCFA » */
export const fcfa = (n: number): string => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;

/** Année de cotisation : 2027 tant que la caisse n'a pas ouvert, puis l'année civile en cours. */
export function anneeCaisse(): number {
  return Math.max(2027, new Date().getFullYear());
}

export const caisseOuverte = (): boolean => Date.now() >= DEBUT_CAISSE.getTime();

/** Numéro du mois en cours (1 à 12) pour savoir si un membre est à jour. */
export function moisCourant(): number {
  return caisseOuverte() ? new Date().getMonth() + 1 : 0;
}

/** Texte de statut d'un membre selon les mois couverts depuis janvier. */
export function statutCotisation(moisCouverts: number, annee: number): { aJour: boolean; texte: string } {
  if (moisCouverts <= 0) return { aJour: false, texte: "Pas encore de cotisation" };
  const aJour = moisCouverts >= moisCourant();
  const jusqua = moisCouverts >= 12 ? `fin ${annee}` : `fin ${MOIS[moisCouverts - 1]} ${annee}`;
  return { aJour, texte: aJour ? `À jour, couvert jusqu’à ${jusqua}` : `Couvert jusqu’à ${jusqua}` };
}

// Tant que la caisse n'est pas annoncée au groupe, seuls les administrateurs et l'équipe de la caisse voient la rubrique.
// Passer à true le jour de l'annonce.
export const CAISSE_VISIBLE_MEMBRES = false;

// ---------- Vie du groupe (naissance, décès, mariage) ----------
export const TYPES_VIE = [
  { cle: "naissance", label: "Naissance" },
  { cle: "deces", label: "Décès" },
  { cle: "mariage", label: "Mariage" },
  { cle: "autre", label: "Autre événement" },
];

export interface EvenementVie {
  id: string;
  uid: string;
  nomSignalant: string;
  type: string;
  personne: string;
  date: string;
  message?: string;
  statut: "en_attente" | "valide" | "refuse";
  creeLe?: { seconds: number } | null;
}

// ---------- Demandes d'aide ----------
export const TYPES_AIDE = [
  "Urgence médicale",
  "Décès et obsèques",
  "Naissance",
  "Scolarité",
  "Logement",
  "Autre difficulté",
];

export type StatutAide = "nouvelle" | "accordee" | "refusee" | "versee";

export interface DemandeAide {
  id: string;
  uid: string;
  nom: string;
  telephone?: string;
  type: string;
  urgence: "urgent" | "normal";
  description: string;
  montantDemande?: number;
  statut: StatutAide;
  montantAccorde?: number;
  motifDecision?: string;
  creeLe?: { seconds: number } | null;
}

export interface VoteAide {
  uid: string;
  nom: string;
  vote: "pour" | "contre" | "abstention";
}

export interface ParametresCaisse {
  plafondAide?: number;
}

export const LIBELLE_STATUT_AIDE: Record<StatutAide, string> = {
  nouvelle: "En étude par le comité",
  accordee: "Accordée",
  refusee: "Refusée",
  versee: "Accordée et versée",
};

// ---------- Contrôles de la trésorerie ----------
/** À partir de ce montant (FCFA), une dépense doit être approuvée par une deuxième personne. */
export const SEUIL_DOUBLE_CONTROLE = 50000;
/** À partir de ce montant (FCFA), un justificatif (photo de la facture ou du reçu) est obligatoire. */
export const SEUIL_JUSTIFICATIF = 10000;

/** Empreinte courte d'une capture d'écran : deux captures identiques donnent la même empreinte (détection des doublons). */
export function empreinte(texte: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(16)}-${texte.length}`;
}

export interface LigneJournal {
  id: string;
  sens: "entree" | "sortie";
  montant: number;
  libelle: string;
  categorie: string;
  ref?: string;
  acteurNom?: string;
  creeLe?: { seconds: number } | null;
}

export interface Rapprochement {
  id: string;
  date: string;
  soldeCalcule: number;
  soldeReel: number;
  ecart: number;
  note?: string;
  acteurNom?: string;
  creeLe?: { seconds: number } | null;
}
