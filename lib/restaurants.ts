import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

export const CUISINES = [
  "Cuisine malienne", "Cuisine africaine", "Cuisine française", "Cuisine libanaise", "Fast-food & grillades", "Pizzeria",
  "Pâtisserie & boulangerie", "Café & salon de thé", "Glacier & jus", "Traiteur", "Autre",
];
export const SERVICES = ["Sur place", "À emporter", "Livraison"];
export const CATEGORIES_MENU = ["Entrées", "Plats", "Grillades", "Accompagnements", "Desserts", "Boissons", "Autre"];
export const MAX_PHOTOS_RESTO = 6;
export const MAX_PLATS = 80;

export interface Plat {
  cat: string;
  nom: string;
  prix: number;
  desc: string;
}

export interface Resto {
  id: string;
  nom: string;
  cuisine: string;
  description: string;
  adresse: string;
  quartier: string;
  ville: string;
  horaires: string;
  tel: string;
  services: string[];
  liens: string[];
  menu: Plat[];
  platDuJour: string;
  vignette: string;
  ownerUid: string;
  ownerNom: string;
  nbAvis: number;
  sommeNotes: number;
  statut: "valide" | "en_attente";
}

export interface AvisResto {
  uid: string;
  auteurNom: string;
  note: number;
  commentaire: string;
}

export function restoDepuisDoc(id: string, x: Record<string, unknown>): Resto {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const a = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((e): e is string => typeof e === "string") : []);
  const menu: Plat[] = Array.isArray(x.menu)
    ? (x.menu as Record<string, unknown>[]).map((p) => ({ cat: s(p?.cat), nom: s(p?.nom), prix: n(p?.prix), desc: s(p?.desc) })).filter((p) => p.nom)
    : [];
  return {
    id,
    nom: s(x.nom),
    cuisine: s(x.cuisine),
    description: s(x.description),
    adresse: s(x.adresse),
    quartier: s(x.quartier),
    ville: s(x.ville) || "Bamako",
    horaires: s(x.horaires),
    tel: s(x.tel),
    services: a(x.services),
    liens: a(x.liens),
    menu,
    platDuJour: s(x.platDuJour),
    vignette: s(x.vignette),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    nbAvis: n(x.nbAvis),
    sommeNotes: n(x.sommeNotes),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
  };
}

export function moyenneResto(r: Pick<Resto, "nbAvis" | "sommeNotes">): number {
  return r.nbAvis > 0 ? r.sommeNotes / r.nbAvis : 0;
}

export function prixFcfa(n: number): string {
  return n > 0 ? `${n.toLocaleString("fr-FR")} FCFA` : "";
}

export async function enregistrerPhotosResto(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "restos", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 200, 0.7).catch(() => "") : "";
}

export async function lirePhotosResto(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "restos", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}
