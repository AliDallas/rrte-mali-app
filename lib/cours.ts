import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

export type TypeCours = "ecole" | "cours";

export const MATIERES_COURS = [
  "Arabe & études islamiques",
  "Anglais & langues",
  "Français & soutien scolaire",
  "Informatique & numérique",
  "Mathématiques & sciences",
  "Musique, art & dessin",
  "Sport & arts martiaux",
  "Formation professionnelle",
  "Primaire & maternelle",
  "Collège & lycée",
  "Université & enseignement supérieur",
  "Autre",
];

export const libelleTypeCours = (t: TypeCours) => (t === "ecole" ? "École / centre" : "Cours");

export interface Cours {
  id: string;
  type: TypeCours;
  titre: string;
  matiere: string;
  lieu: string;
  horaires: string;
  prix: string;
  niveau: string;
  description: string;
  telephone: string;
  liens: string[];
  vignette: string;
  statut: string;
  ownerUid: string;
  ownerNom: string;
}

export function coursDepuisDoc(id: string, x: Record<string, unknown>): Cours {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    type: x.type === "ecole" ? "ecole" : "cours",
    titre: s(x.titre),
    matiere: s(x.matiere),
    lieu: s(x.lieu),
    horaires: s(x.horaires),
    prix: s(x.prix),
    niveau: s(x.niveau),
    description: s(x.description),
    telephone: s(x.telephone),
    liens: Array.isArray(x.liens) ? (x.liens as unknown[]).filter((l): l is string => typeof l === "string") : [],
    vignette: s(x.vignette),
    statut: s(x.statut) || "valide",
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
  };
}

export async function enregistrerPhotosCours(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "cours", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 160, 0.7).catch(() => "") : "";
}

export async function lirePhotosCours(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "cours", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}
