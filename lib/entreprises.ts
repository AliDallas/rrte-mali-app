export const CATEGORIES = [
  "Restauration",
  "Commerce",
  "Agriculture & élevage",
  "BTP & immobilier",
  "Services aux entreprises",
  "Santé & bien-être",
  "Beauté & mode",
  "Éducation & formation",
  "Transport & logistique",
  "Numérique & communication",
  "Hôtellerie & tourisme",
  "Événementiel",
  "Autre",
];

export interface EntrepriseSaisie {
  type: "proprietaire" | "recommandation";
  nom: string;
  categorie: string;
  description: string;
  quartier: string;
  adresse: string;
  tel: string;
  email: string;
  siteWeb: string;
  liens: string; // un lien par ligne (Facebook, Instagram, TikTok, vidéos YouTube…)
  horaires: string;
  logo: string;
  photos: string[];
}

export interface Entreprise extends Omit<EntrepriseSaisie, "liens"> {
  id: string;
  vignette: string;
  liens: string[];
  ownerUid: string;
  ownerNom: string;
  statut: "en_attente" | "publie";
}

export function saisieVide(type: EntrepriseSaisie["type"] = "proprietaire"): EntrepriseSaisie {
  return { type, nom: "", categorie: "", description: "", quartier: "", adresse: "", tel: "", email: "", siteWeb: "", liens: "", horaires: "", logo: "", photos: [] };
}

export function listeLiens(txt: string): string[] {
  return txt
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(lienPropre)
    .slice(0, 10);
}

export function lienPropre(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function entrepriseDepuisDoc(id: string, x: Record<string, unknown>): Entreprise {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const a = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  return {
    id,
    type: x.type === "recommandation" ? "recommandation" : "proprietaire",
    nom: s(x.nom),
    categorie: s(x.categorie),
    description: s(x.description),
    quartier: s(x.quartier),
    adresse: s(x.adresse),
    tel: s(x.tel),
    email: s(x.email),
    siteWeb: s(x.siteWeb),
    liens: a(x.liens),
    horaires: s(x.horaires),
    logo: s(x.logo),
    photos: a(x.photos), // anciennes fiches ; les nouvelles photos sont dans entreprises/{id}/medias/main
    vignette: s(x.vignette),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "publie" ? "publie" : "en_attente",
  };
}

/** Données à enregistrer dans Firestore (sans id ni statut). */
export function saisieVersDoc(f: EntrepriseSaisie) {
  return {
    type: f.type,
    nom: f.nom.trim(),
    categorie: f.categorie,
    description: f.description.trim(),
    quartier: f.quartier.trim(),
    adresse: f.adresse.trim(),
    tel: f.tel.trim(),
    email: f.email.trim(),
    siteWeb: f.siteWeb.trim() ? lienPropre(f.siteWeb.trim()) : "",
    liens: listeLiens(f.liens),
    horaires: f.horaires.trim(),
    logo: f.logo,
  };
}

export function videoYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function etiquetteLien(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("youtu")) return "YouTube";
  if (u.includes("facebook") || u.includes("fb.")) return "Facebook";
  if (u.includes("instagram")) return "Instagram";
  if (u.includes("tiktok")) return "TikTok";
  if (u.includes("wa.me") || u.includes("whatsapp")) return "WhatsApp";
  if (u.includes("linkedin")) return "LinkedIn";
  return url.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0];
}

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";

/** Les photos (lourdes) sont rangées à part pour que la liste des entreprises reste légère. */
export async function enregistrerPhotos(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "entreprises", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 128, 0.7).catch(() => "") : "";
}

export async function lirePhotos(id: string, anciennes: string[] = []): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "entreprises", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : anciennes;
  } catch {
    return anciennes;
  }
}
