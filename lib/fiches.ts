export interface Fiche {
  id: string;
  nom: string;
  prenom: string;
  tels: string[];
  cles: string[];
  email: string;
  ville: string;
  activite: string;
  competences: string;
  anciennete: string;
  reseaux: string;
  attentes: string;
  info: string;
  aConfirmer: boolean;
  statutFiche: string;
  uid: string | null;
}

/** Clé de rapprochement : les 8 derniers chiffres d'un numéro (indépendant de l'indicatif). */
export function cle(tel: string): string {
  return tel.replace(/\D/g, "").slice(-8);
}

export function chiffres(tel: string): string {
  return tel.replace(/\D/g, "");
}

export function nomComplet(f: Pick<Fiche, "nom" | "prenom">): string {
  const n = `${f.prenom} ${f.nom}`.trim();
  return n || "Membre RRTE";
}

export function ficheDepuisDoc(id: string, x: Record<string, unknown>): Fiche {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id,
    nom: s(x.nom),
    prenom: s(x.prenom),
    tels: Array.isArray(x.tels) ? (x.tels as string[]) : [],
    cles: Array.isArray(x.cles) ? (x.cles as string[]) : [],
    email: s(x.email),
    ville: s(x.ville),
    activite: s(x.activite),
    competences: s(x.competences),
    anciennete: s(x.anciennete),
    reseaux: s(x.reseaux),
    attentes: s(x.attentes),
    info: s(x.info),
    aConfirmer: x.aConfirmer === true,
    statutFiche: s(x.statutFiche),
    uid: typeof x.uid === "string" ? x.uid : null,
  };
}

/** Lecture simple d'un fichier CSV (séparateur virgule, guillemets doubles, BOM toléré). */
export function lireCsv(texte: string): Record<string, string>[] {
  const t = texte.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  if (rows.length < 2) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    head.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}
