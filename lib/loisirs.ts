import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

export const CATEGORIES_LOISIRS = [
  "Sortie / Restaurant",
  "Plage, fleuve & nature",
  "Hôtel & maison d’hôtes",
  "Sport & bien-être",
  "Activités enfants",
  "Culture & visites",
  "Soirée & musique",
  "Autre",
];

export interface Loisir {
  id: string;
  titre: string;
  categorie: string;
  description: string;
  adresse: string;
  liens: string[];
  vignette: string;
  ownerUid: string;
  ownerNom: string;
}

export function loisirDepuisDoc(id: string, x: Record<string, unknown>): Loisir {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    titre: s(x.titre),
    categorie: s(x.categorie),
    description: s(x.description),
    adresse: s(x.adresse),
    liens: Array.isArray(x.liens) ? (x.liens as unknown[]).filter((l): l is string => typeof l === "string") : [],
    vignette: s(x.vignette),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
  };
}

/** Les photos (lourdes) sont rangées à part pour garder la liste légère ; on renvoie la vignette. */
export async function enregistrerPhotosLoisir(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "loisirs", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 160, 0.7).catch(() => "") : "";
}

export async function lirePhotosLoisir(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "loisirs", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}
