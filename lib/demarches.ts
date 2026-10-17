export const CATEGORIES_DEMARCHES = [
  "État civil (naissance, actes, livret)",
  "Mariage & divorce",
  "Passeport & carte d’identité",
  "Visas & titres de séjour",
  "Nationalité & papiers France",
  "Légalisation, traduction & apostille",
  "Permis & carte grise",
  "Famille & enfants",
  "Impôts, douane & retraite",
  "Création d’entreprise & foncier",
  "Foncier & logement",
  "Justice & police",
  "Études & social",
  "Autre",
];

export const LIEUX_DEMARCHES = ["Mali", "France", "Mali & France", "Autre pays"];

export interface Demarche {
  id: string;
  titre: string;
  categorie: string;
  lieu: string;
  resume: string;
  etapes: string;
  pieces: string;
  cout: string;
  delai: string;
  adresse: string;
  liens: string[];
  verifieLe: string; // AAAA-MM-JJ
  ownerUid: string;
  ownerNom: string;
  statut: "valide" | "en_attente";
}

export function demarcheDepuisDoc(id: string, x: Record<string, unknown>): Demarche {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    titre: s(x.titre),
    categorie: s(x.categorie),
    lieu: s(x.lieu),
    resume: s(x.resume),
    etapes: s(x.etapes),
    pieces: s(x.pieces),
    cout: s(x.cout),
    delai: s(x.delai),
    adresse: s(x.adresse),
    liens: Array.isArray(x.liens) ? (x.liens as unknown[]).filter((l): l is string => typeof l === "string") : [],
    verifieLe: s(x.verifieLe),
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
  };
}

export function lignes(t: string): string[] {
  return t.split("\n").map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim()).filter(Boolean);
}

export function visibleDemarche(d: Pick<Demarche, "statut" | "ownerUid">, uid?: string, admin?: boolean): boolean {
  return d.statut !== "en_attente" || !!admin || (!!uid && d.ownerUid === uid);
}
