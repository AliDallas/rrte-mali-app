export const METIERS = [
  "Coiffeur / Coiffeuse",
  "Couturier / Couturière",
  "Plombier",
  "Électricien",
  "Maçon",
  "Menuisier",
  "Peintre",
  "Mécanicien",
  "Chauffeur",
  "Traiteur / Cuisinier",
  "Femme de ménage / Ménage",
  "Photographe / Vidéaste",
  "Informatique / Téléphonie",
  "Santé / Bien-être",
  "Juridique / Administratif",
  "Autre",
];

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
  };
}

export function moyenne(p: Pick<Prestataire, "nbAvis" | "sommeNotes">): number {
  return p.nbAvis > 0 ? p.sommeNotes / p.nbAvis : 0;
}
