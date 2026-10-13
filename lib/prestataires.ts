import { DOMAINES } from "./domaines";

export const METIERS = DOMAINES;

export interface Prestataire {
  id: string;
  nom: string;
  metier: string;
  tel: string;
  quartier: string;
  description: string;
  ownerUid: string;
  ownerNom: string;
  nbAvis: number;
  sommeNotes: number;
  statut: "valide" | "en_attente";
}

export interface Avis {
  uid: string;
  auteurNom: string;
  note: number;
  commentaire: string;
}

export function prestataireDepuisDoc(id: string, x: Record<string, unknown>): Prestataire {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    id,
    nom: s(x.nom),
    metier: s(x.metier),
    tel: s(x.tel),
    quartier: s(x.quartier),
    description: s(x.description),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    nbAvis: n(x.nbAvis),
    sommeNotes: n(x.sommeNotes),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
  };
}

export function moyenne(p: Pick<Prestataire, "nbAvis" | "sommeNotes">): number {
  return p.nbAvis > 0 ? p.sommeNotes / p.nbAvis : 0;
}

/** Une recommandation en attente n'est visible que de son auteur et des administrateurs. */
export function visiblePour(p: Pick<Prestataire, "statut" | "ownerUid">, uid?: string, admin?: boolean): boolean {
  return p.statut !== "en_attente" || !!admin || (!!uid && p.ownerUid === uid);
}
