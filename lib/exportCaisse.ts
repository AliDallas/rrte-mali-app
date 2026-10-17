// Export Excel de la caisse : un seul fichier .xlsx avec une feuille par sujet. Réservé à l'équipe de la caisse et aux administrateurs.
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { Cotisant, Cotisation, Depense, LigneJournal, Rapprochement, Totaux, fcfa, statutCotisation } from "./caisse";
import { FeuilleXlsx, fabriquerXlsx } from "./xlsxMini";

type Ts = { seconds: number } | null | undefined;
const jour = (t: Ts) => (t ? new Date(t.seconds * 1000).toLocaleDateString("fr-FR") : "");
const jourHeure = (t: Ts) => (t ? new Date(t.seconds * 1000).toLocaleString("fr-FR") : "");
const dateIso = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");

const STATUT_COTISATION: Record<string, string> = { en_attente: "En attente", valide: "Validé", refuse: "Refusé", annule: "Annulé" };

export async function exporterExcel(annee: number): Promise<string> {
  const [tot, cot, dep, jou, cots, mem, rap] = await Promise.all([
    getDoc(doc(db, "caisse_totaux", "global")),
    getDocs(collection(db, "cotisations")),
    getDocs(collection(db, "depenses")),
    getDocs(query(collection(db, "journal"), orderBy("creeLe", "asc"))),
    getDocs(query(collection(db, "cotisants"), where("annee", "==", annee))),
    getDocs(query(collection(db, "users"), where("statut", "==", "actif"))),
    getDocs(query(collection(db, "rapprochements"), orderBy("creeLe", "desc"))),
  ]);

  const totaux: Totaux = tot.exists() ? (tot.data() as Totaux) : { encaisse: 0, depense: 0 };
  const cotisations = cot.docs.map((d) => ({ ...(d.data() as Cotisation), id: d.id })).sort((a, b) => (a.creeLe?.seconds ?? 0) - (b.creeLe?.seconds ?? 0));
  const depenses = dep.docs.map((d) => ({ ...(d.data() as Depense), id: d.id })).sort((a, b) => a.date.localeCompare(b.date));
  const journal = jou.docs.map((d) => ({ ...(d.data() as LigneJournal), id: d.id }));
  const cotisants = cots.docs.map((d) => d.data() as Cotisant).sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
  const rapprochements = rap.docs.map((d) => ({ ...(d.data() as Rapprochement), id: d.id }));
  const membres = mem.docs
    .map((d) => d.data() as { uid: string; prenom: string; nom: string; telephone?: string })
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
  const aCotise = new Set(cotisants.map((c) => c.uid));
  const aJour = cotisants.filter((c) => statutCotisation(c.moisCouverts, annee).aJour).length;
  const solde = totaux.encaisse - totaux.depense;
  const dernier = rapprochements[0];

  let cumul = 0;
  const lignesJournal = journal.map((l) => {
    cumul += l.sens === "entree" ? l.montant : -l.montant;
    return [jourHeure(l.creeLe), l.libelle, l.categorie, l.ref ?? "", l.sens === "entree" ? l.montant : null, l.sens === "sortie" ? l.montant : null, cumul, l.acteurNom ?? ""];
  });

  const feuilles: FeuilleXlsx[] = [
    {
      nom: "Résumé",
      colonnes: ["Indicateur", "Valeur"],
      lignes: [
        ["Export réalisé le", new Date().toLocaleString("fr-FR")],
        ["Année de cotisation", annee],
        ["Total encaissé (FCFA)", totaux.encaisse],
        ["Total dépensé (FCFA)", totaux.depense],
        ["Solde calculé (FCFA)", solde],
        ["Dernier solde réel constaté (FCFA)", dernier ? dernier.soldeReel : "aucun rapprochement"],
        ["Date du dernier rapprochement", dernier ? dateIso(dernier.date) : ""],
        ["Écart au dernier rapprochement", dernier ? fcfa(dernier.ecart) : ""],
        ["Membres actifs", membres.length],
        ["Membres ayant cotisé", cotisants.length],
        ["Membres à jour", aJour],
        ["Membres n’ayant pas cotisé", membres.filter((m) => !aCotise.has(m.uid)).length],
        ["Paiements en attente de validation", cotisations.filter((c) => c.statut === "en_attente").length],
      ],
    },
    { nom: "Journal", colonnes: ["Date", "Libellé", "Catégorie", "Référence", "Entrée (FCFA)", "Sortie (FCFA)", "Solde (FCFA)", "Saisi par"], lignes: lignesJournal },
    {
      nom: "Cotisations",
      colonnes: ["Date d’envoi", "Membre", "Année", "Mois", "Montant (FCFA)", "Rythme", "Reçu", "Statut", "Validé le", "N° de transaction", "Motif"],
      lignes: cotisations.map((c) => [jour(c.creeLe), c.nom, c.annee, c.nbMois, c.montant, c.rythme, c.recu ?? "", STATUT_COTISATION[c.statut] ?? c.statut, jour(c.valideLe), c.reference ?? "", c.motifRefus ?? ""]),
    },
    {
      nom: "Dépenses",
      colonnes: ["Date", "Libellé", "Catégorie", "Montant (FCFA)", "État", "Saisi par", "Approuvé par", "Justificatif", "Raison d’annulation"],
      lignes: depenses.map((d) => [
        dateIso(d.date), d.libelle, d.categorie, d.montant,
        d.annulee ? "Annulée" : (d.statut ?? "validee") === "a_approuver" ? "En attente d’approbation" : "Validée",
        d.saisiPar ?? "", d.approuveNom ?? "", d.aJustificatif ? "Oui" : "Non", d.motifAnnulation ?? "",
      ]),
    },
    {
      nom: "Cotisants",
      colonnes: ["Membre", "Année", "Mois couverts", "Situation"],
      lignes: cotisants.map((c) => [`${c.prenom} ${c.nom}`.trim(), c.annee, c.moisCouverts, statutCotisation(c.moisCouverts, annee).texte]),
    },
    {
      nom: "Pas encore cotisé",
      colonnes: ["Membre", "Téléphone"],
      lignes: membres.filter((m) => !aCotise.has(m.uid)).map((m) => [`${m.prenom} ${m.nom}`.trim(), m.telephone ?? ""]),
    },
    {
      nom: "Rapprochements",
      colonnes: ["Date", "Solde calculé (FCFA)", "Solde réel (FCFA)", "Écart (FCFA)", "Note", "Fait par"],
      lignes: rapprochements.map((r) => [dateIso(r.date), r.soldeCalcule, r.soldeReel, r.ecart, r.note ?? "", r.acteurNom ?? ""]),
    },
  ];

  const octets = fabriquerXlsx(feuilles);
  const nom = `RRTE-caisse-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const blob = new Blob([octets as unknown as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return nom;
}
