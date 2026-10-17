// Opérations comptables de la caisse : chaque mouvement d'argent écrit aussi une ligne dans le journal (jamais modifiée ni effacée).
import { WriteBatch, collection, doc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Depense, SEUIL_DOUBLE_CONTROLE } from "./caisse";

export interface EntreeJournal {
  sens: "entree" | "sortie";
  montant: number;
  libelle: string;
  categorie: string;
  ref?: string;
  acteurUid: string;
  acteurNom: string;
}

/** Prépare une ligne du journal : à écrire avec batch.set(ref, data) ou tx.set(ref, data). */
export function ligneJournal(e: EntreeJournal) {
  const ref = doc(collection(db, "journal"));
  const data = { ...e, ref: e.ref ?? "", creeLe: serverTimestamp() };
  return { ref, data };
}

export interface NouvelleDepense {
  date: string;
  libelle: string;
  categorie: string;
  montant: number;
  saisiPar: string;
  saisiUid: string;
  justificatif?: string;
  aideId?: string;
}

/** Enregistre une dépense. À partir du seuil, elle attend l'approbation d'une deuxième personne et ne touche pas encore les comptes. */
export function opsNouvelleDepense(batch: WriteBatch, d: NouvelleDepense): { id: string; statut: "validee" | "a_approuver" } {
  const ref = doc(collection(db, "depenses"));
  const statut = d.montant >= SEUIL_DOUBLE_CONTROLE ? "a_approuver" : "validee";
  batch.set(ref, {
    date: d.date,
    libelle: d.libelle,
    categorie: d.categorie,
    montant: d.montant,
    saisiPar: d.saisiPar,
    saisiUid: d.saisiUid,
    aJustificatif: !!d.justificatif,
    statut,
    annulee: false,
    ...(d.aideId ? { aideId: d.aideId } : {}),
    creeLe: serverTimestamp(),
  });
  if (d.justificatif) batch.set(doc(db, "depenses_justificatifs", ref.id), { image: d.justificatif });
  if (statut === "validee") {
    batch.set(doc(db, "caisse_totaux", "global"), { depense: increment(d.montant) }, { merge: true });
    const j = ligneJournal({ sens: "sortie", montant: d.montant, libelle: d.libelle, categorie: d.categorie, ref: ref.id, acteurUid: d.saisiUid, acteurNom: d.saisiPar });
    batch.set(j.ref, j.data);
  }
  return { id: ref.id, statut };
}

/** Approbation d'une dépense importante par une autre personne que celle qui l'a saisie. */
export function opsApprouverDepense(batch: WriteBatch, d: Depense, acteurUid: string, acteurNom: string) {
  batch.update(doc(db, "depenses", d.id), { statut: "validee", approuvePar: acteurUid, approuveNom: acteurNom, approuveLe: serverTimestamp() });
  batch.set(doc(db, "caisse_totaux", "global"), { depense: increment(d.montant) }, { merge: true });
  const j = ligneJournal({ sens: "sortie", montant: d.montant, libelle: d.libelle, categorie: d.categorie, ref: d.id, acteurUid, acteurNom });
  batch.set(j.ref, j.data);
}

/** Annulation (et non suppression) d'une dépense : la ligne reste visible avec sa raison et le journal garde l'écriture inverse. */
export function opsAnnulerDepense(batch: WriteBatch, d: Depense, motif: string, acteurUid: string, acteurNom: string) {
  batch.update(doc(db, "depenses", d.id), { annulee: true, motifAnnulation: motif, annuleLe: serverTimestamp() });
  if ((d.statut ?? "validee") === "validee") {
    batch.set(doc(db, "caisse_totaux", "global"), { depense: increment(-d.montant) }, { merge: true });
    const j = ligneJournal({ sens: "entree", montant: d.montant, libelle: `Annulation : ${d.libelle}`, categorie: "Annulation", ref: d.id, acteurUid, acteurNom });
    batch.set(j.ref, j.data);
  }
}
