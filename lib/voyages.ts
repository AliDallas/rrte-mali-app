export type TarifMode = "kilo" | "valise" | "les_deux";
export type TypeAnnonce = "kilos" | "accompagnateur" | "besoin";

export const TYPES_ANNONCE: { key: TypeAnnonce; titre: string; aide: string }[] = [
  { key: "kilos", titre: "Je vends mes kilos ou ma valise", aide: "Je voyage et j’ai de la place pour des colis." },
  { key: "accompagnateur", titre: "Je voyage : je peux accompagner", aide: "Je veux bien accompagner un enfant ou une personne âgée qui voyage seul(e)." },
  { key: "besoin", titre: "Je cherche quelqu’un pour accompagner", aide: "Mon enfant ou mon parent voyage : je cherche un membre qui prend le même vol." },
];

export const PERSONNES_BESOIN = ["Mon enfant", "Mes enfants", "Mon père ou ma mère", "Un autre proche"];
export const PERSONNES_ACCOMPAGNEES = ["Enfants", "Personnes âgées", "Enfants et personnes âgées"];

export function libelleType(t: TypeAnnonce): string {
  return t === "kilos" ? "Kilos & valises" : t === "accompagnateur" ? "Je peux accompagner" : "Cherche un accompagnateur";
}

export interface Voyage {
  id: string;
  ownerUid: string;
  ownerNom: string;
  tel: string;
  depart: string;
  arrivee: string;
  dateVol: string; // AAAA-MM-JJ
  compagnie: string;
  tarifMode: TarifMode;
  prixKilo: number;
  prixValise: number;
  valiseDesc: string;
  devise: string;
  kilosDispo: number;
  dateLimite: string; // AAAA-MM-JJ, dépôt des colis
  message: string;
  typeAnnonce: TypeAnnonce;
  personne: string; // qui est accompagné (besoin) ou qui peut être accompagné (accompagnateur)
  agePersonne: string;
  dateSouple: boolean;
  statut: "valide" | "en_attente";
}

export const VILLES = ["Bamako", "Paris", "Marseille", "Lyon", "Lille", "Bordeaux", "Toulouse", "Bruxelles", "Dakar", "Abidjan", "Casablanca", "Istanbul", "Dubaï"];
export const DEVISES = ["FCFA", "€", "$"];

export function voyageDepuisDoc(id: string, x: Record<string, unknown>): Voyage {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  const m = x.tarifMode;
  return {
    id,
    ownerUid: s(x.ownerUid),
    ownerNom: s(x.ownerNom),
    tel: s(x.tel),
    depart: s(x.depart),
    arrivee: s(x.arrivee),
    dateVol: s(x.dateVol),
    compagnie: s(x.compagnie),
    tarifMode: m === "valise" || m === "les_deux" ? m : "kilo",
    prixKilo: n(x.prixKilo),
    prixValise: n(x.prixValise),
    valiseDesc: s(x.valiseDesc),
    devise: s(x.devise) || "FCFA",
    kilosDispo: n(x.kilosDispo),
    dateLimite: s(x.dateLimite),
    message: s(x.message),
    typeAnnonce: x.typeAnnonce === "accompagnateur" || x.typeAnnonce === "besoin" ? x.typeAnnonce : "kilos",
    personne: s(x.personne),
    agePersonne: s(x.agePersonne),
    dateSouple: x.dateSouple === true,
    statut: x.statut === "en_attente" ? "en_attente" : "valide",
  };
}

export function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateFr(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [a, m, j] = iso.split("-");
  return `${j}/${m}/${a}`;
}

export function expire(v: Pick<Voyage, "dateVol">): boolean {
  return !!v.dateVol && v.dateVol < aujourdhui();
}

export function montant(n: number, devise: string): string {
  return `${n.toLocaleString("fr-FR")} ${devise}`;
}

export function resumeTarif(v: Voyage): string {
  const k = v.prixKilo > 0 ? `${montant(v.prixKilo, v.devise)} / kg` : "";
  const val = v.prixValise > 0 ? `${v.valiseDesc || "Valise"} : ${montant(v.prixValise, v.devise)}` : "";
  if (v.tarifMode === "kilo") return k || "Prix à discuter";
  if (v.tarifMode === "valise") return val || "Prix à discuter";
  return [k, val].filter(Boolean).join(" · ") || "Prix à discuter";
}
