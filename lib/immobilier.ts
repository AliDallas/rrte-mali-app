import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

export type TypeAnnonceImmo = "location" | "courte" | "vente" | "recherche";

export const TYPES_IMMO: { key: TypeAnnonceImmo; court: string; titre: string; aide: string }[] = [
  { key: "location", court: "Location", titre: "Je loue un bien (longue durée)", aide: "Maison, appartement, studio, local… meublé ou non." },
  { key: "courte", court: "Court séjour", titre: "Je propose un court séjour", aide: "Location à la nuit ou à la semaine." },
  { key: "vente", court: "Vente", titre: "Je vends", aide: "Maison, villa, terrain, parcelle, local…" },
  { key: "recherche", court: "Je cherche", titre: "Je cherche un bien", aide: "Je cherche à louer ou à acheter, et je décris mon besoin." },
];

export const BIENS = ["Maison / villa", "Appartement", "Studio / chambre", "Terrain / parcelle", "Local commercial / bureau", "Entrepôt", "Autre"];
export const MEUBLES = [
  { key: "meuble", label: "Meublé" },
  { key: "non_meuble", label: "Non meublé" },
];
export const PERIODES = [
  { key: "mois", label: "par mois" },
  { key: "nuit", label: "par nuit" },
  { key: "semaine", label: "par semaine" },
  { key: "fixe", label: "prix total" },
];
export const DEVISES_IMMO = ["FCFA", "€", "$"];
export const VILLES_IMMO = ["Bamako", "Kati", "Koulikoro", "Ségou", "Sikasso", "Mopti", "Autre ville"];
export const QUARTIERS_BAMAKO = [
  "ACI 2000", "Hamdallaye", "Badalabougou", "Quartier du Fleuve", "Niarela", "Hippodrome", "Lafiabougou", "Magnambougou",
  "Sotuba", "Kalaban Coura", "Faladié", "Sébénikoro", "Baco-Djicoroni", "Titibougou", "Missabougou", "Sogoniko",
  "Korofina", "Djélibougou", "Banconi", "Yirimadio", "Sénou", "Bamako Coura", "Daoudabougou", "N’Tomikorobougou", "Kalaban Coro",
];
export const EQUIPEMENTS = [
  "Climatisation", "Eau courante", "Électricité (EDM)", "Groupe électrogène", "Panneaux solaires", "Forage / puits",
  "Gardien", "Parking", "Cuisine équipée", "Wifi", "Piscine", "Clôture / mur", "Terrasse / jardin",
];
export const PAPIERS = [
  "Titre foncier", "Permis d’occuper", "Lettre d’attribution ou attestation de la mairie", "Acte ou livret de cession", "En cours de régularisation", "À discuter",
];

export const MAX_PHOTOS_IMMO = 6;

export interface Immo {
  id: string;
  ownerUid: string;
  ownerNom: string;
  tel: string;
  typeAnnonce: TypeAnnonceImmo;
  bien: string;
  meuble: string;
  titre: string;
  ville: string;
  quartier: string;
  prix: number;
  devise: string;
  periode: string;
  negociable: boolean;
  surface: number;
  pieces: number;
  equipements: string[];
  papiers: string[];
  disponibleLe: string;
  description: string;
  vignette: string;
  statut: "valide" | "en_attente";
  termine: boolean; // loué / vendu / trouvé
}

export function immoDepuisDoc(id: string, x: Record<string, unknown>): Immo {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const a = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((e): e is string => typeof e === "string") : []);
  const t = x.typeAnnonce;
  return {
    id,
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    tel: s(x.tel),
    typeAnnonce: t === "courte" || t === "vente" || t === "recherche" ? t : "location",
    bien: s(x.bien),
    meuble: s(x.meuble),
    titre: s(x.titre),
    ville: s(x.ville),
    quartier: s(x.quartier),
    prix: n(x.prix),
    devise: s(x.devise) || "FCFA",
    periode: s(x.periode),
    negociable: x.negociable === true,
    surface: n(x.surface),
    pieces: n(x.pieces),
    equipements: a(x.equipements),
    papiers: a(x.papiers),
    disponibleLe: s(x.disponibleLe),
    description: s(x.description),
    vignette: s(x.vignette),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
    termine: x.termine === true,
  };
}

export function libelleTypeImmo(t: TypeAnnonceImmo): string {
  return TYPES_IMMO.find((x) => x.key === t)?.court ?? "";
}

export function resumePrix(i: Immo): string {
  if (!i.prix) return i.typeAnnonce === "recherche" ? "Budget à discuter" : "Prix à discuter";
  const p = PERIODES.find((x) => x.key === i.periode);
  const montant = `${i.prix.toLocaleString("fr-FR")} ${i.devise}`;
  return `${montant}${p && p.key !== "fixe" ? ` ${p.label}` : ""}${i.negociable ? " · négociable" : ""}`;
}

export function libelleTermine(t: TypeAnnonceImmo): string {
  return t === "vente" ? "Vendu" : t === "recherche" ? "Trouvé" : "Loué ou pris";
}

export async function enregistrerPhotosImmo(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "immobilier", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 200, 0.7).catch(() => "") : "";
}

export async function lirePhotosImmo(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "immobilier", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}
