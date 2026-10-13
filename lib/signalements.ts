export const MOTIFS_SIGNALEMENT = [
  "Messages personnels ou privés non sollicités",
  "Racolage, drague insistante",
  "Démarchage ou publicité répétés (hors rubriques prévues)",
  "Arnaque ou contenu trompeur",
  "Propos irrespectueux, insultes",
  "Autre",
];

export interface Signalement {
  id: string;
  auteurUid: string;
  auteurNom: string;
  cibleType: string;
  cibleId: string;
  cibleNom: string;
  cibleUid: string;
  motif: string;
  commentaire: string;
  chemin: string;
  statut: "nouveau" | "traite";
  createdAt: number;
}

export function signalementDepuisDoc(id: string, x: Record<string, unknown>): Signalement {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const t = x.createdAt as { toMillis?: () => number } | undefined;
  return {
    id,
    auteurUid: s(x.auteurUid),
    auteurNom: s(x.auteurNom),
    cibleType: s(x.cibleType),
    cibleId: s(x.cibleId),
    cibleNom: s(x.cibleNom),
    cibleUid: s(x.cibleUid),
    motif: s(x.motif),
    commentaire: s(x.commentaire),
    chemin: s(x.chemin),
    statut: x.statut === "traite" ? "traite" : "nouveau",
    createdAt: t?.toMillis ? t.toMillis() : 0,
  };
}
