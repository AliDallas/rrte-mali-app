import type { Fiche, FicheSaisie } from "./fiches";

export interface DonneesPresentation {
  prenom: string;
  nom: string;
  tel: string;
  email: string;
  reseaux: string;
  pays: string;
  quartier: string;
  anneeRetour: string;
  activite: string;
  presentation: string;
  competences: string;
  objectif: string;
  cherche: string;
  propose: string;
}

/** Texte de bienvenue prêt à coller dans le groupe WhatsApp (les champs vides sont omis). */
export function texteBienvenue(d: DonneesPresentation): string {
  const nom = `${d.prenom} ${d.nom}`.trim() || "ce nouveau membre";
  const lignes: [string, string][] = [
    ["👤 *Nom*", d.nom],
    ["👤 *Prénom*", d.prenom],
    ["📞 *Numéro*", d.tel],
    ["✉️ *Mail*", d.email],
    ["🌐 *Réseaux*", d.reseaux],
    ["📍 *Pays de résidence*", d.pays],
    ["🏠 *Quartier au Mali*", d.quartier],
    ["📅 *Au Mali depuis*", d.anneeRetour],
    ["💼 *Activités*", d.activite],
    ["🏢 *Entreprise / projet*", d.presentation],
    ["🛠️ *Compétences*", d.competences],
    ["🎯 *Objectifs, besoins, centres d’intérêt*", d.objectif],
    ["🔎 *Je cherche*", d.cherche],
    ["🤝 *Je propose*", d.propose],
  ];
  const corps = lignes
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k} : ${v.trim()}`)
    .join("\n");
  return `Salam aleykoum 👋\n\nBienvenue à *${nom}* dans le groupe RRTE 🇲🇱\n\nVoici sa présentation :\n\n${corps}\n\n${d.prenom ? `${d.prenom}, si` : "Si"} tu le souhaites, tu peux nous faire une petite présentation de toi et de tes activités au Mali 🇲🇱\n\nCela permettra à chacun de mieux te connaître et de créer des connexions utiles 🤝\n\nEncore bienvenue parmi nous`;
}

type Membre = { prenom: string; nom: string; email: string; telephone?: string; fiche?: FicheSaisie };

/** Rassemble ce que le membre a saisi à l'inscription, complété par sa fiche d'annuaire si elle existe. */
export function donneesDepuisInscription(m: Membre, f?: Fiche): DonneesPresentation {
  const s = m.fiche;
  const pick = (a?: string, b?: string) => (a && a.trim() ? a : b ?? "");
  return {
    prenom: m.prenom,
    nom: m.nom,
    tel: m.telephone || f?.tels?.[0] || "",
    email: m.email,
    reseaux: pick(s?.reseaux, f?.reseaux),
    pays: pick(s?.pays, f?.pays),
    quartier: pick(s?.quartier, f?.ville),
    anneeRetour: pick(s?.anneeRetour, f?.anciennete),
    activite: pick(s?.activite, f?.activite),
    presentation: pick(s?.presentation, f?.presentation),
    competences: pick(s?.competences, f?.competences),
    objectif: pick(s?.objectif, f?.attentes),
    cherche: f?.cherche ?? "",
    propose: f?.propose ?? "",
  };
}

export function donneesDepuisFiche(f: Fiche): DonneesPresentation {
  return {
    prenom: f.prenom,
    nom: f.nom,
    tel: f.tels[0] ?? "",
    email: f.email,
    reseaux: f.reseaux,
    pays: f.pays,
    quartier: f.ville,
    anneeRetour: f.anciennete,
    activite: f.activite,
    presentation: f.presentation,
    competences: f.competences,
    objectif: f.attentes,
    cherche: f.cherche,
    propose: f.propose,
  };
}

/** Message à envoyer à la personne dont l'inscription vient d'être acceptée. */
export function texteAcceptation(prenom: string): string {
  return `Bonjour${prenom ? ` ${prenom}` : ""},\n\nNous avons bien reçu votre demande et nous avons le plaisir de vous annoncer qu’elle est acceptée ✅\n\nVous avez désormais accès à l’application RRTE : https://rrte-mali-app.vercel.app\n\nNous allons aussi vous intégrer très prochainement au groupe WhatsApp.\n\nBienvenue parmi nous 🇲🇱\nL’équipe RRTE`;
}
