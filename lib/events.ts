import { format, parseISO, isValid } from "date-fns";
import { QueryDocumentSnapshot, collection, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, setDoc, startAfter } from "firebase/firestore";
import { db } from "./firebase";
import { reduireDataUrl } from "./image";
import { fr } from "date-fns/locale";

export type EventCategorie = "rrte" | "membres";

export interface EventItem {
  id: string;
  titre: string;
  description: string;
  date: string; // AAAA-MM-JJ
  heure: string; // HH:mm
  lieu: string;
  attendees: string[];
  created_by: string;
  categorie: EventCategorie; // "rrte" : organisé par le groupe ; "membres" : proposé par un membre ou une association
  organisateurType: "membre" | "association";
  organisateurNom: string;
  typeEvenement: string;
  participation: string; // « Gratuit », « 5 000 FCFA »…
  contact: string;
  liens: string[];
  vignette: string;
  statut: "valide" | "en_attente";
  covoiturage: boolean;
}

export const TYPES_EVENEMENT_MEMBRES = [
  "Repas & sortie entre amis",
  "Activité",
  "Atelier & formation",
  "Association & solidarité",
  "Sport & détente",
  "Enfants & famille",
  "Soirée & fête",
  "Autre",
];

export function eventDepuisDoc(id: string, x: Record<string, unknown>): EventItem {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    titre: s(x.titre),
    description: s(x.description),
    date: s(x.date),
    heure: s(x.heure),
    lieu: s(x.lieu),
    attendees: Array.isArray(x.attendees) ? (x.attendees as string[]) : [],
    created_by: s(x.created_by),
    categorie: x.categorie === "membres" ? "membres" : "rrte",
    organisateurType: x.organisateurType === "association" ? "association" : "membre",
    organisateurNom: s(x.organisateurNom),
    typeEvenement: s(x.typeEvenement),
    participation: s(x.participation),
    contact: s(x.contact),
    liens: Array.isArray(x.liens) ? (x.liens as unknown[]).filter((l): l is string => typeof l === "string") : [],
    vignette: s(x.vignette),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
    covoiturage: x.covoiturage === true,
  };
}

export async function enregistrerPhotosEvent(id: string, photos: string[]): Promise<string> {
  await setDoc(doc(db, "events", id, "medias", "main"), { photos });
  return photos[0] ? reduireDataUrl(photos[0], 160, 0.7).catch(() => "") : "";
}

export async function lirePhotosEvent(id: string): Promise<string[]> {
  try {
    const s = await getDoc(doc(db, "events", id, "medias", "main"));
    const p = s.exists() ? s.data().photos : null;
    return Array.isArray(p) ? (p as string[]) : [];
  } catch {
    return [];
  }
}

export function dayParts(date: string): { jour: string; mois: string } {
  const d = parseISO(date);
  if (!isValid(d)) return { jour: "--", mois: "" };
  return {
    jour: format(d, "d", { locale: fr }),
    mois: format(d, "MMM", { locale: fr }).replace(".", "").toUpperCase(),
  };
}

export function longDate(date: string): string {
  const d = parseISO(date);
  if (!isValid(d)) return date;
  return format(d, "EEEE d MMMM yyyy", { locale: fr });
}

export function isUpcoming(date: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return date >= today;
}

export interface PhotoGalerie {
  id: string;
  data: string;
  auteurUid: string;
  auteurNom: string;
}

export const MAX_PHOTOS_GALERIE = 60;

/** Une photo de galerie = un petit document à part (limite d'1 Mo par document dans Firestore). */
export async function ajouterPhotoGalerie(
  eventId: string,
  dataUrl: string,
  ordre: number,
  auteurUid = "",
  auteurNom = ""
): Promise<string> {
  const id = `g${ordre}`;
  await setDoc(doc(db, "events", eventId, "medias", id), { kind: "galerie", ordre, data: dataUrl, auteurUid, auteurNom });
  return id;
}

export async function compterGalerie(eventId: string): Promise<number> {
  const s = await getCountFromServer(query(collection(db, "events", eventId, "medias"), orderBy("ordre", "asc")));
  return s.data().count;
}

export async function lireGalerie(
  eventId: string,
  apres?: QueryDocumentSnapshot,
  taille = 12
): Promise<{ photos: PhotoGalerie[]; dernier?: QueryDocumentSnapshot; fini: boolean }> {
  const base = collection(db, "events", eventId, "medias");
  const snap = await getDocs(apres ? query(base, orderBy("ordre", "asc"), startAfter(apres), limit(taille)) : query(base, orderBy("ordre", "asc"), limit(taille)));
  return {
    photos: snap.docs
      .map((d) => ({ id: d.id, data: String(d.data().data ?? ""), auteurUid: String(d.data().auteurUid ?? ""), auteurNom: String(d.data().auteurNom ?? "") }))
      .filter((p) => p.data),
    dernier: snap.docs[snap.docs.length - 1],
    fini: snap.docs.length < taille,
  };
}
