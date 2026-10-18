import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export const MAX_PHOTOS_FIL = 3;
export const MAX_LIENS_FIL = 3;
export const MAX_TEXTE_FIL = 1500;

export interface Publication {
  id: string;
  texte: string;
  liens: string[];
  nbPhotos: number;
  ownerUid: string;
  ownerNom: string;
  statut: "valide" | "en_attente";
  aimes: string[];
  creeLe: number;
}

export function publicationDepuisDoc(id: string, x: Record<string, unknown>): Publication {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const a = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).filter((e): e is string => typeof e === "string") : []);
  const t = x.creeLe as { seconds?: number } | null | undefined;
  return {
    id,
    texte: s(x.texte),
    liens: a(x.liens),
    nbPhotos: typeof x.nbPhotos === "number" ? x.nbPhotos : 0,
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
    aimes: a(x.aimes),
    creeLe: t?.seconds ? t.seconds * 1000 : Date.now(),
  };
}

export async function enregistrerPhotosFil(id: string, photos: string[]) {
  await setDoc(doc(db, "fil", id, "medias", "main"), { photos });
}

export async function lirePhotosFil(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "fil", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}

/** « il y a 3 h », « hier », « le 12 octobre ». */
export function depuis(ms: number): string {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j === 1) return "hier";
  if (j < 7) return `il y a ${j} jours`;
  return `le ${new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}
