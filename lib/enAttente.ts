import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export interface RubriqueAttente {
  cle: string;
  libelle: string;
  collection: string;
  champ: string;
  valeur: string;
  href: string;
}

/** Tout ce qui attend une décision d'un administrateur. */
export const RUBRIQUES_ATTENTE: RubriqueAttente[] = [
  { cle: "users", libelle: "Inscriptions de membres", collection: "users", champ: "statut", valeur: "en_attente", href: "/admin" },
  { cle: "signalements", libelle: "Signalements", collection: "signalements", champ: "statut", valeur: "nouveau", href: "/admin/signalements" },
  { cle: "besoins", libelle: "Besoins & urgences", collection: "besoins", champ: "statut", valeur: "en_attente", href: "/solidarite/besoins" },
  { cle: "structures", libelle: "Pages d’associations et de collectifs", collection: "structures", champ: "statut", valeur: "en_attente", href: "/solidarite" },
  { cle: "initiatives", libelle: "Initiatives des membres", collection: "initiatives", champ: "statut", valeur: "en_attente", href: "/solidarite/initiatives" },
  { cle: "demarches", libelle: "Fiches de démarches", collection: "demarches", champ: "statut", valeur: "en_attente", href: "/demarches" },
  { cle: "events", libelle: "Événements proposés", collection: "events", champ: "statut", valeur: "en_attente", href: "/evenements" },
  { cle: "voyages", libelle: "Offres voyageurs", collection: "voyages", champ: "statut", valeur: "en_attente", href: "/voyages" },
  { cle: "immobilier", libelle: "Annonces immobilières", collection: "immobilier", champ: "statut", valeur: "en_attente", href: "/immobilier" },
  { cle: "restos", libelle: "Restaurants", collection: "restos", champ: "statut", valeur: "en_attente", href: "/restaurants" },
  { cle: "prestataires", libelle: "Recommandés proposés", collection: "prestataires", champ: "statut", valeur: "en_attente", href: "/prestataires" },
];

export interface ResultatAttente extends RubriqueAttente {
  n: number;
}

export async function compterAttente(): Promise<{ total: number; details: ResultatAttente[] }> {
  const details = await Promise.all(
    RUBRIQUES_ATTENTE.map(async (r) => {
      try {
        const snap = await getDocs(query(collection(db, r.collection), where(r.champ, "==", r.valeur)));
        return { ...r, n: snap.size };
      } catch {
        return { ...r, n: 0 };
      }
    })
  );
  return { total: details.reduce((t, d) => t + d.n, 0), details };
}
