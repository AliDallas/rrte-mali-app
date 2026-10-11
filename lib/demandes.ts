export type TypeDemande = "cherche" | "propose";

export interface Demande {
  id: string;
  type: TypeDemande;
  titre: string;
  details: string;
  categorie: string;
  auteurUid: string;
  auteurNom: string;
  auteurPhoto: string;
  statut: "ouverte" | "resolue";
  nbReponses: number;
  createdAt: number;
}

export interface Reponse {
  id: string;
  auteurUid: string;
  auteurNom: string;
  auteurPhoto: string;
  texte: string;
  tel: string;
  createdAt: number;
}

export function demandeDepuisDoc(id: string, x: Record<string, unknown>): Demande {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    id,
    type: x.type === "propose" ? "propose" : "cherche",
    titre: s(x.titre),
    details: s(x.details),
    categorie: s(x.categorie),
    auteurUid: s(x.auteurUid),
    auteurNom: s(x.auteurNom),
    auteurPhoto: s(x.auteurPhoto),
    statut: x.statut === "resolue" ? "resolue" : "ouverte",
    nbReponses: n(x.nbReponses),
    createdAt: n(x.createdAt),
  };
}

export function reponseDepuisDoc(id: string, x: Record<string, unknown>): Reponse {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    auteurUid: s(x.auteurUid),
    auteurNom: s(x.auteurNom),
    auteurPhoto: s(x.auteurPhoto),
    texte: s(x.texte),
    tel: s(x.tel),
    createdAt: typeof x.createdAt === "number" ? x.createdAt : 0,
  };
}

export function ilYa(ms: number): string {
  if (!ms) return "";
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "à l’instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} jour${j > 1 ? "s" : ""}`;
}

const MOTS_VIDES = new Set(["cherche", "recherche", "besoin", "pour", "dans", "avec", "quelqu", "quelqun", "une", "des", "les", "cherchons", "propose", "bamako"]);

export function motsCles(texte: string): string[] {
  return Array.from(
    new Set(
      texte
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((m) => m.length >= 4 && !MOTS_VIDES.has(m)),
    ),
  );
}
