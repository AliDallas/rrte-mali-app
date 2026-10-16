import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

export type TypeStructure = "association" | "collectif";

export const LIBELLE_STRUCTURE: Record<TypeStructure, { un: string; pluriel: string; cle: string; route: string }> = {
  association: { un: "association", pluriel: "Associations", cle: "association", route: "associations" },
  collectif: { un: "collectif", pluriel: "Collectifs", cle: "collectif", route: "collectifs" },
};

export const CATEGORIES_STRUCTURE = [
  "Enfance & orphelins",
  "Santé & handicap",
  "Éducation & jeunesse",
  "Aide aux familles",
  "Urgence & aide alimentaire",
  "Femmes & entrepreneuriat",
  "Culture & sport",
  "Environnement",
  "Entraide professionnelle",
  "Autre",
];

export const TYPES_PUBLICATION = [
  { cle: "evenement", libelle: "Événement" },
  { cle: "actualite", libelle: "Actualité / action" },
  { cle: "affiche", libelle: "Affiche" },
  { cle: "don", libelle: "Appel aux dons" },
] as const;
export type CleTypePublication = (typeof TYPES_PUBLICATION)[number]["cle"];

export const MAX_PHOTOS_STRUCTURE = 6;
export const MAX_LIENS_STRUCTURE = 6;

export const REGLES_ADMIN_STRUCTURE: string[] = [
  "Je suis le seul administrateur de cette page et je publie uniquement au nom de la structure que je représente.",
  "Je ne publie que des informations exactes, sans propos discriminatoires, haineux, politiques partisans ou contraires à la loi.",
  "Pour les appels aux dons, je ne mets que des liens ou des coordonnées qui m’appartiennent ou qui appartiennent à la structure, et j’explique clairement l’usage des fonds.",
  "Je n’affiche pas de données personnelles de tiers (photos d’enfants, adresses, numéros) sans leur accord, ou celui de leurs parents.",
  "Mes droits se limitent à ma page : je n’ai aucun droit sur le reste de l’application.",
  "Les administrateurs RRTE peuvent masquer, corriger ou retirer une page ou une publication, et me retirer l’administration en cas de manquement.",
  "RRTE et son application ne sont pas responsables du contenu publié ni des dons échangés, notamment au regard du droit français : chaque publication relève de la seule responsabilité de son auteur.",
];

export const AVERTISSEMENT_DONS =
  "Les dons se font directement entre vous et la structure, hors de l’application. RRTE ne collecte, ne vérifie et ne garantit aucun don. Donnez de préférence à des personnes ou structures que vous connaissez, et signalez toute page qui vous paraît douteuse.";

export interface LienDon {
  libelle: string;
  url: string;
}

export interface Structure {
  id: string;
  type: TypeStructure;
  nom: string;
  categorie: string;
  description: string;
  ville: string;
  contact: string;
  liens: string[];
  liensDon: LienDon[];
  infosDon: string;
  vignette: string;
  ownerUid: string;
  ownerNom: string;
  statut: "valide" | "en_attente";
}

export interface Publication {
  id: string;
  type: CleTypePublication;
  titre: string;
  texte: string;
  date: string; // AAAA-MM-JJ (date de l’événement ou de l’action), facultative
  lieu: string;
  liens: string[];
  affiche: string;
  auteurUid: string;
  creeLe: number;
}

export interface Initiative {
  id: string;
  titre: string;
  texte: string;
  categorie: string;
  date: string;
  lieu: string;
  liens: string[];
  affiche: string;
  ownerUid: string;
  ownerNom: string;
  statut: "valide" | "en_attente";
  creeLe: number;
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const a = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((e): e is string => typeof e === "string") : []);
const ms = (v: unknown): number => {
  const t = v as { toMillis?: () => number } | null | undefined;
  return t && typeof t.toMillis === "function" ? t.toMillis() : 0;
};

export function structureDepuisDoc(id: string, x: Record<string, unknown>): Structure {
  const dons: LienDon[] = Array.isArray(x.liensDon)
    ? (x.liensDon as Record<string, unknown>[]).map((d) => ({ libelle: s(d?.libelle), url: s(d?.url) })).filter((d) => d.url)
    : [];
  return {
    id,
    type: x.type === "collectif" ? "collectif" : "association",
    nom: s(x.nom),
    categorie: s(x.categorie),
    description: s(x.description),
    ville: s(x.ville),
    contact: s(x.contact),
    liens: a(x.liens),
    liensDon: dons,
    infosDon: s(x.infosDon),
    vignette: s(x.vignette),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
  };
}

export function publicationDepuisDoc(id: string, x: Record<string, unknown>): Publication {
  const t = TYPES_PUBLICATION.find((p) => p.cle === x.type);
  return {
    id,
    type: t ? t.cle : "actualite",
    titre: s(x.titre),
    texte: s(x.texte),
    date: s(x.date),
    lieu: s(x.lieu),
    liens: a(x.liens),
    affiche: s(x.affiche),
    auteurUid: s(x.auteurUid),
    creeLe: ms(x.creeLe),
  };
}

export function initiativeDepuisDoc(id: string, x: Record<string, unknown>): Initiative {
  return {
    id,
    titre: s(x.titre),
    texte: s(x.texte),
    categorie: s(x.categorie),
    date: s(x.date),
    lieu: s(x.lieu),
    liens: a(x.liens),
    affiche: s(x.affiche),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
    creeLe: ms(x.creeLe),
  };
}

export function libelleTypePublication(c: string): string {
  return TYPES_PUBLICATION.find((t) => t.cle === c)?.libelle ?? "Actualité";
}

export function dateFr(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export async function enregistrerPhotosStructure(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "structures", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 200, 0.7).catch(() => "") : "";
}

export async function lirePhotosStructure(id: string): Promise<string[]> {
  try {
    const d = await getDoc(doc(db, "structures", id, "medias", "main"));
    const p = d.exists() ? d.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}

// ───────────── Besoins & urgences (avec date limite) ─────────────

export const TYPES_BESOIN = [
  "Urgence médicale",
  "Aide alimentaire",
  "Don financier",
  "Don en nature (vêtements, matériel…)",
  "Bénévoles",
  "Hébergement / transport",
  "Autre",
];

export interface Besoin {
  id: string;
  titre: string;
  texte: string;
  type: string;
  urgent: boolean;
  dateLimite: string; // AAAA-MM-JJ
  lieu: string;
  contact: string;
  liens: string[];
  affiche: string;
  resolu: boolean;
  ownerUid: string;
  ownerNom: string;
  statut: "valide" | "en_attente";
  creeLe: number;
}

export function besoinDepuisDoc(id: string, x: Record<string, unknown>): Besoin {
  return {
    id,
    titre: s(x.titre),
    texte: s(x.texte),
    type: s(x.type),
    urgent: x.urgent === true,
    dateLimite: s(x.dateLimite),
    lieu: s(x.lieu),
    contact: s(x.contact),
    liens: a(x.liens),
    affiche: s(x.affiche),
    resolu: x.resolu === true,
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
    creeLe: ms(x.creeLe),
  };
}

/** Jours restants avant la date limite (0 = aujourd'hui, négatif = expiré). null si pas de date. */
export function joursRestants(iso: string): number | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const fin = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  const auj = new Date();
  const debut = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate()).getTime();
  return Math.round((fin - debut) / 86400000);
}

export function libelleDelai(iso: string): string {
  const j = joursRestants(iso);
  if (j === null) return "";
  if (j < 0) return "Expiré";
  if (j === 0) return "Dernier jour : aujourd’hui";
  if (j === 1) return "Il reste 1 jour";
  return `Il reste ${j} jours`;
}
