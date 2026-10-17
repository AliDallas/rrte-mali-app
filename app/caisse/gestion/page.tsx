"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, writeBatch, limit,
} from "firebase/firestore";
import { CheckCircle2, ChevronLeft, FileSpreadsheet, ImagePlus, MessageCircle, Trash2, X, XCircle } from "lucide-react";
import { lienWhatsAppVers } from "@/lib/contact";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { reduireImage } from "@/lib/image";
import {
  CAISSE_VISIBLE_MEMBRES, CATEGORIES_DEPENSE, Cotisant, Cotisation, Depense, LigneJournal, MOIS, MONTANT_MENSUEL, ParametresCaisse, Rapprochement, SEUIL_DOUBLE_CONTROLE, SEUIL_JUSTIFICATIF, Totaux,
  anneeCaisse, fcfa, statutCotisation,
} from "@/lib/caisse";
import { exporterExcel } from "@/lib/exportCaisse";
import { ligneJournal, opsAnnulerDepense, opsApprouverDepense, opsNouvelleDepense } from "@/lib/caisseOps";

const input = "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
type Onglet = "paiements" | "dons" | "depenses" | "journal" | "controle" | "suivi" | "equipe";
interface MembreLeger {
  uid: string;
  prenom: string;
  nom: string;
  telephone?: string;
}
interface Equipier {
  uid: string;
  nom: string;
  role: "tresorier" | "controleur";
}

function GestionContenu() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const admin = profile?.role === "admin";
  const annee = anneeCaisse();
  const [roleCaisse, setRoleCaisse] = useState<"tresorier" | "controleur" | null>(null);
  const [verifie, setVerifie] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("paiements");
  const [totaux, setTotaux] = useState<Totaux>({ encaisse: 0, depense: 0 });
  const [enAttente, setEnAttente] = useState<Cotisation[]>([]);
  const [valides, setValides] = useState<Cotisation[]>([]);
  const [tousValides, setTousValides] = useState<Cotisation[]>([]);
  const [journal, setJournal] = useState<LigneJournal[]>([]);
  const [rapprochements, setRapprochements] = useState<Rapprochement[]>([]);
  const [export_, setExport] = useState(false);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [cotisants, setCotisants] = useState<Cotisant[]>([]);
  const [membres, setMembres] = useState<MembreLeger[]>([]);
  const [equipe, setEquipe] = useState<Equipier[]>([]);
  const [comite, setComite] = useState<Equipier[]>([]);
  const [plafond, setPlafond] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);

  const gere = admin || (CAISSE_VISIBLE_MEMBRES && roleCaisse === "tresorier");
  const voit = admin || (CAISSE_VISIBLE_MEMBRES && roleCaisse !== null);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "caisse_tresoriers", uid))
      .then((s) => setRoleCaisse(s.exists() ? ((s.data() as Equipier).role ?? "controleur") : null))
      .catch(() => undefined)
      .finally(() => setVerifie(true));
  }, [uid]);

  const charger = useCallback(async () => {
    try {
      const [t, att, val, dep, cot, mem, eq, com, par, jou, rap] = await Promise.all([
        getDoc(doc(db, "caisse_totaux", "global")),
        getDocs(query(collection(db, "cotisations"), where("statut", "==", "en_attente"))),
        getDocs(query(collection(db, "cotisations"), where("statut", "==", "valide"))),
        getDocs(query(collection(db, "depenses"), orderBy("date", "desc"), limit(100))),
        getDocs(query(collection(db, "cotisants"), where("annee", "==", annee))),
        getDocs(query(collection(db, "users"), where("statut", "==", "actif"))),
        getDocs(collection(db, "caisse_tresoriers")),
        getDocs(collection(db, "caisse_comite")),
        getDoc(doc(db, "caisse_config", "parametres")),
        getDocs(query(collection(db, "journal"), orderBy("creeLe", "asc"), limit(1000))),
        getDocs(query(collection(db, "rapprochements"), orderBy("creeLe", "desc"), limit(50))),
      ]);
      setTotaux(t.exists() ? (t.data() as Totaux) : { encaisse: 0, depense: 0 });
      const parDate = (a: Cotisation, b: Cotisation) => (b.creeLe?.seconds ?? 0) - (a.creeLe?.seconds ?? 0);
      setEnAttente(att.docs.map((d) => ({ ...(d.data() as Cotisation), id: d.id })).sort(parDate));
      const toutesValides = val.docs.map((d) => ({ ...(d.data() as Cotisation), id: d.id })).sort(parDate);
      setTousValides(toutesValides);
      setValides(toutesValides.slice(0, 30));
      setJournal(jou.docs.map((d) => ({ ...(d.data() as LigneJournal), id: d.id })));
      setRapprochements(rap.docs.map((d) => ({ ...(d.data() as Rapprochement), id: d.id })));
      setDepenses(dep.docs.map((d) => ({ ...(d.data() as Depense), id: d.id })));
      setCotisants(cot.docs.map((d) => d.data() as Cotisant));
      setMembres(
        mem.docs
          .map((d) => d.data() as MembreLeger)
          .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"))
      );
      setEquipe(eq.docs.map((d) => d.data() as Equipier));
      setComite(com.docs.map((d) => d.data() as Equipier));
      setPlafond(par.exists() ? (par.data() as ParametresCaisse).plafondAide : undefined);
    } catch {
      setMessage("Certaines données n’ont pas pu être lues. Vérifiez que les règles de sécurité sont à jour.");
    }
  }, [annee]);

  useEffect(() => {
    if (verifie && voit) void charger();
  }, [verifie, voit, charger]);

  if (!verifie) {
    return <AppShell title="Gestion de la caisse"><p className="text-muted">Vérification…</p></AppShell>;
  }
  if (!voit) {
    return (
      <AppShell title="Gestion de la caisse">
        <p className="card p-6 text-center text-muted">Cette page est réservée à l’équipe de la caisse et aux administrateurs.</p>
      </AppShell>
    );
  }

  const solde = totaux.encaisse - totaux.depense;
  const ONGLETS: { cle: Onglet; label: string; n?: number }[] = [
    { cle: "paiements", label: "Paiements", n: enAttente.length },
    { cle: "dons", label: "Dons" },
    { cle: "depenses", label: "Dépenses", n: depenses.filter((d) => d.statut === "a_approuver" && !d.annulee).length },
    { cle: "journal", label: "Journal" },
    { cle: "controle", label: "Solde réel" },
    { cle: "suivi", label: "Suivi" },
    ...(admin ? [{ cle: "equipe" as Onglet, label: "Équipe" }] : []),
  ];

  return (
    <AppShell title="Gestion de la caisse" subtitle={`Trésorerie ${annee}`}>
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="card p-3"><p className="font-display text-sm font-bold tabular-nums">{fcfa(totaux.encaisse)}</p><p className="text-xs text-muted">Encaissé</p></div>
        <div className="card p-3"><p className="font-display text-sm font-bold tabular-nums">{fcfa(totaux.depense)}</p><p className="text-xs text-muted">Dépensé</p></div>
        <div className="card border-2 border-gold-500 p-3"><p className="font-display text-sm font-bold tabular-nums">{fcfa(solde)}</p><p className="text-xs text-muted">Solde</p></div>
      </div>

      <button
        onClick={async () => {
          setExport(true);
          setMessage("");
          try {
            await exporterExcel(annee);
          } catch {
            setMessage("L’export a échoué. Vérifiez votre connexion et que les règles de sécurité sont à jour.");
          }
          setExport(false);
        }}
        disabled={export_}
        className="btn-outline mb-4 flex w-full items-center justify-center gap-2"
      >
        <FileSpreadsheet size={18} /> {export_ ? "Préparation du fichier…" : "Exporter en Excel"}
      </button>

      {!gere && <div className="mb-4 rounded-xl bg-gold-500/10 p-3 text-sm">Vous avez un accès de consultation : vous voyez les comptes sans pouvoir les modifier.</div>}
      {message && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{message}</div>}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            onClick={() => setOnglet(o.cle)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${onglet === o.cle ? "bg-ink text-ink-fg" : "border border-line"}`}
          >
            {o.label}
            {!!o.n && <span className="rounded-full bg-brand-red px-2 text-xs font-bold text-white">{o.n}</span>}
          </button>
        ))}
      </div>

      {onglet === "paiements" && (
        <PaiementsOnglet enAttente={enAttente} valides={valides} tousValides={tousValides} acteurNom={`${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim()} gere={gere} occupe={occupe} setOccupe={setOccupe} setMessage={setMessage} recharger={charger} validePar={uid ?? ""} />
      )}
      {onglet === "dons" && (
        <DonsOnglet gere={gere} occupe={occupe} setOccupe={setOccupe} setMessage={setMessage} recharger={charger} acteurNom={`${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim()} acteurUid={uid ?? ""} />
      )}
      {onglet === "depenses" && (
        <DepensesOnglet depenses={depenses} uid={uid ?? ""} peutApprouver={voit} gere={gere} occupe={occupe} setOccupe={setOccupe} setMessage={setMessage} recharger={charger} nomSaisie={`${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim()} />
      )}
      {onglet === "journal" && <JournalOnglet journal={journal} totaux={totaux} />}
      {onglet === "controle" && <ControleOnglet rapprochements={rapprochements} soldeCalcule={solde} acteurNom={`${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim()} acteurUid={uid ?? ""} setMessage={setMessage} recharger={charger} />}
      {onglet === "suivi" && <SuiviOnglet membres={membres} cotisants={cotisants} annee={annee} />}
      {onglet === "equipe" && admin && <EquipeOnglet equipe={equipe} comite={comite} plafond={plafond} membres={membres} setMessage={setMessage} recharger={charger} />}
    </AppShell>
  );
}

interface Commun {
  gere: boolean;
  occupe: boolean;
  setOccupe: (b: boolean) => void;
  setMessage: (m: string) => void;
  recharger: () => Promise<void>;
}

function PaiementsOnglet({ enAttente, valides, tousValides, acteurNom, gere, occupe, setOccupe, setMessage, recharger, validePar }: Commun & { enAttente: Cotisation[]; valides: Cotisation[]; tousValides: Cotisation[]; acteurNom: string; validePar: string }) {
  const [verifies, setVerifies] = useState<string[]>([]);

  /** Autres paiements qui ressemblent à celui-ci : même numéro de transaction ou même capture d'écran. */
  function doublonsDe(c: Cotisation): Cotisation[] {
    const ref = (c.reference ?? "").trim().toLowerCase();
    return [...tousValides, ...enAttente.filter((x) => x.id !== c.id)].filter(
      (x) => x.id !== c.id && ((ref !== "" && (x.reference ?? "").trim().toLowerCase() === ref) || (!!c.empreinte && x.empreinte === c.empreinte))
    );
  }
  const [refus, setRefus] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [agrandi, setAgrandi] = useState<string | null>(null);
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);
  const [motifAnnul, setMotifAnnul] = useState("");

  async function annuler(c: Cotisation) {
    if (!motifAnnul.trim()) {
      setMessage("Indiquez la raison de l’annulation.");
      return;
    }
    setOccupe(true);
    setMessage("");
    try {
      await runTransaction(db, async (tx) => {
        const cref = doc(db, "cotisations", c.id);
        const csnap = await tx.get(cref);
        if (!csnap.exists() || csnap.data().statut !== "valide") throw new Error("deja");
        const kref = doc(db, "cotisants", `${c.uid}_${c.annee}`);
        const ksnap = await tx.get(kref);
        const reste = (ksnap.exists() ? Number(ksnap.data().moisCouverts) || 0 : 0) - c.nbMois;
        tx.update(cref, { statut: "annule", motifRefus: motifAnnul.trim(), valideLe: serverTimestamp(), validePar });
        if (reste > 0) tx.update(kref, { moisCouverts: reste, maj: serverTimestamp() });
        else if (ksnap.exists()) tx.delete(kref);
        tx.set(doc(db, "caisse_totaux", "global"), { encaisse: increment(-c.montant) }, { merge: true });
        const j = ligneJournal({ sens: "sortie", montant: c.montant, libelle: `Annulation du reçu ${c.recu ?? ""} (${c.nom})`.replace("  ", " "), categorie: "Annulation", ref: c.recu ?? c.id, acteurUid: validePar, acteurNom });
        tx.set(j.ref, j.data);
      });
      setAAnnuler(null);
      setMotifAnnul("");
    } catch (e) {
      setMessage(e instanceof Error && e.message === "deja" ? "Ce paiement n’est plus validé." : "L’annulation a échoué. Réessayez.");
    }
    await recharger();
    setOccupe(false);
  }

  async function valider(c: Cotisation) {
    setOccupe(true);
    setMessage("");
    try {
      await runTransaction(db, async (tx) => {
        const cref = doc(db, "cotisations", c.id);
        const csnap = await tx.get(cref);
        if (!csnap.exists() || csnap.data().statut !== "en_attente") throw new Error("deja");
        const kref = doc(db, "cotisants", `${c.uid}_${c.annee}`);
        const ksnap = await tx.get(kref);
        const usnap = await tx.get(doc(db, "users", c.uid));
        const gref = doc(db, "caisse_totaux", "global");
        const gsnap = await tx.get(gref);
        const ancien = ksnap.exists() ? Number(ksnap.data().moisCouverts) || 0 : 0;
        const u = usnap.exists() ? usnap.data() : {};
        const numero = (gsnap.exists() ? Number(gsnap.data().compteurRecus) || 0 : 0) + 1;
        const recu = `RRTE-${c.annee}-${String(numero).padStart(4, "0")}`;
        const apres = Math.min(12, ancien + c.nbMois);
        tx.update(cref, { statut: "valide", valideLe: serverTimestamp(), validePar, recu, moisApres: apres });
        tx.set(kref, {
          uid: c.uid,
          prenom: u.prenom ?? c.nom,
          nom: u.nom ?? "",
          annee: c.annee,
          moisCouverts: apres,
          maj: serverTimestamp(),
        });
        tx.set(gref, { encaisse: increment(c.montant), compteurRecus: numero }, { merge: true });
        const j = ligneJournal({ sens: "entree", montant: c.montant, libelle: `Cotisation de ${c.nom} (${c.nbMois} mois)`, categorie: "Cotisation", ref: recu, acteurUid: validePar, acteurNom });
        tx.set(j.ref, j.data);
      });
    } catch (e) {
      setMessage(e instanceof Error && e.message === "deja" ? "Ce paiement a déjà été traité." : "La validation a échoué. Réessayez.");
    }
    await recharger();
    setOccupe(false);
  }

  async function refuser(c: Cotisation) {
    setOccupe(true);
    try {
      await updateDoc(doc(db, "cotisations", c.id), { statut: "refuse", motifRefus: motif.trim(), valideLe: serverTimestamp(), validePar });
      setRefus(null);
      setMotif("");
    } catch {
      setMessage("Le refus n’a pas pu être enregistré.");
    }
    await recharger();
    setOccupe(false);
  }

  return (
    <div className="space-y-3">
      {enAttente.length === 0 ? (
        <p className="card p-6 text-center text-muted">Aucun paiement à valider.</p>
      ) : (
        enAttente.map((c) => (
          <div key={c.id} className="card space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.nom}</p>
                <p className="text-sm text-muted">{fcfa(c.montant)} · {c.nbMois} mois · {c.rythme}</p>
                {c.reference && <p className="text-xs text-muted">N° : {c.reference}</p>}
              </div>
            </div>
            {c.capture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.capture}
                alt="Capture de paiement"
                onClick={() => setAgrandi(agrandi === c.id ? null : c.id)}
                className={`w-full cursor-zoom-in rounded-xl border border-line object-contain ${agrandi === c.id ? "max-h-[80vh]" : "max-h-48"}`}
              />
            )}
            {doublonsDe(c).length > 0 && (
              <div className="space-y-2 rounded-xl bg-brand-red/10 p-3 text-sm">
                <p className="font-semibold text-brand-red">Doublon possible</p>
                {doublonsDe(c).map((x) => (
                  <p key={x.id} className="text-xs">Même numéro de transaction ou même capture que le paiement de {x.nom} ({fcfa(x.montant)}, {x.statut === "valide" ? `déjà validé${x.recu ? `, reçu ${x.recu}` : ""}` : "en attente"}).</p>
                ))}
                <label className="flex cursor-pointer items-start gap-2 text-xs">
                  <input type="checkbox" checked={verifies.includes(c.id)} onChange={(e) => setVerifies((v) => (e.target.checked ? [...v, c.id] : v.filter((i) => i !== c.id)))} className="mt-0.5 h-4 w-4 accent-[#B8860B]" />
                  J’ai vérifié : ce n’est pas un doublon.
                </label>
              </div>
            )}
            {gere &&
              (refus === c.id ? (
                <div className="space-y-2">
                  <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif du refus (visible par le membre)" className={input} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => refuser(c)} disabled={occupe} className="btn-outline">Confirmer le refus</button>
                    <button onClick={() => setRefus(null)} className="btn-outline">Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => valider(c)} disabled={occupe || (doublonsDe(c).length > 0 && !verifies.includes(c.id))} className="btn-gold flex items-center justify-center gap-2 disabled:opacity-40"><CheckCircle2 size={16} /> Valider</button>
                  <button onClick={() => setRefus(c.id)} disabled={occupe} className="btn-outline flex items-center justify-center gap-2"><XCircle size={16} /> Refuser</button>
                </div>
              ))}
          </div>
        ))
      )}
      {valides.length > 0 && (
        <div className="card space-y-2 p-4">
          <p className="text-sm font-semibold">Derniers paiements validés</p>
          {valides.map((c) => (
            <div key={c.id} className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{c.nom}</span>
                <span className="text-xs text-muted">{c.recu ?? ""} · {c.nbMois} mois</span>
                <span className="font-semibold tabular-nums">{fcfa(c.montant)}</span>
                {gere && aAnnuler !== c.id && (
                  <button onClick={() => { setAAnnuler(c.id); setMotifAnnul(""); }} className="text-xs font-semibold text-brand-red underline">Annuler</button>
                )}
              </div>
              {gere && aAnnuler === c.id && (
                <div className="space-y-2 rounded-xl bg-brand-red/5 p-3">
                  <p className="text-xs">Annuler ce paiement retire {fcfa(c.montant)} des comptes et {c.nbMois} mois de la couverture du membre.</p>
                  <input value={motifAnnul} onChange={(e) => setMotifAnnul(e.target.value)} placeholder="Raison (ex. validé par erreur, test)" className={input} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => annuler(c)} disabled={occupe} className="btn-outline">Confirmer l’annulation</button>
                    <button onClick={() => setAAnnuler(null)} className="btn-outline">Garder</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepensesOnglet({ depenses, uid, peutApprouver, gere, occupe, setOccupe, setMessage, recharger, nomSaisie }: Commun & { depenses: Depense[]; uid: string; peutApprouver: boolean; nomSaisie: string }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES_DEPENSE[0]);
  const [montant, setMontant] = useState("");
  const [justificatif, setJustificatif] = useState("");
  const [vu, setVu] = useState<{ id: string; image: string | null } | null>(null);
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);
  const [motifAnnul, setMotifAnnul] = useState("");

  const montantNum = Math.round(Number(montant)) || 0;

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    const m = montantNum;
    if (!libelle.trim() || !(m > 0)) {
      setMessage("Indiquez un libellé et un montant supérieur à zéro.");
      return;
    }
    if (m >= SEUIL_JUSTIFICATIF && !justificatif) {
      setMessage(`Un justificatif (photo de la facture ou du reçu) est obligatoire à partir de ${fcfa(SEUIL_JUSTIFICATIF)}.`);
      return;
    }
    setOccupe(true);
    setMessage("");
    try {
      const batch = writeBatch(db);
      const r = opsNouvelleDepense(batch, { date, libelle: libelle.trim(), categorie, montant: m, saisiPar: nomSaisie, saisiUid: uid, justificatif: justificatif || undefined });
      await batch.commit();
      setLibelle("");
      setMontant("");
      setJustificatif("");
      if (r.statut === "a_approuver") setMessage(`Dépense enregistrée. Elle atteint ${fcfa(SEUIL_DOUBLE_CONTROLE)} : une autre personne de l’équipe doit l’approuver avant qu’elle compte dans les comptes.`);
    } catch {
      setMessage("La dépense n’a pas pu être enregistrée.");
    }
    await recharger();
    setOccupe(false);
  }

  async function approuver(d: Depense) {
    setOccupe(true);
    setMessage("");
    try {
      const batch = writeBatch(db);
      opsApprouverDepense(batch, d, uid, nomSaisie);
      await batch.commit();
    } catch {
      setMessage("L’approbation a échoué : elle doit être faite par une autre personne que celle qui a saisi la dépense.");
    }
    await recharger();
    setOccupe(false);
  }

  async function annuler(d: Depense) {
    if (!motifAnnul.trim()) {
      setMessage("Indiquez la raison de l’annulation.");
      return;
    }
    setOccupe(true);
    setMessage("");
    try {
      const batch = writeBatch(db);
      opsAnnulerDepense(batch, d, motifAnnul.trim(), uid, nomSaisie);
      await batch.commit();
      setAAnnuler(null);
      setMotifAnnul("");
    } catch {
      setMessage("L’annulation a échoué.");
    }
    await recharger();
    setOccupe(false);
  }

  async function voirJustificatif(id: string) {
    if (vu?.id === id) return setVu(null);
    try {
      const s = await getDoc(doc(db, "depenses_justificatifs", id));
      setVu({ id, image: s.exists() ? (s.data().image as string) : null });
    } catch {
      setVu({ id, image: null });
    }
  }

  return (
    <div className="space-y-4">
      {gere && (
        <form onSubmit={ajouter} className="card space-y-3 p-4">
          <h2 className="font-display text-base font-bold">Noter une dépense</h2>
          <div className="rounded-xl bg-gold-500/10 p-3 text-xs">
            Justificatif obligatoire à partir de {fcfa(SEUIL_JUSTIFICATIF)}. À partir de {fcfa(SEUIL_DOUBLE_CONTROLE)}, une deuxième personne de l’équipe doit approuver la dépense.
          </div>
          <label className="block text-sm font-semibold">Date<input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
          <label className="block text-sm font-semibold">Libellé<input required value={libelle} onChange={(e) => setLibelle(e.target.value)} maxLength={120} placeholder="Ex. : location de salle pour le barbecue" className={input} /></label>
          <label className="block text-sm font-semibold">Catégorie
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={input}>
              {CATEGORIES_DEPENSE.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Montant (FCFA)<input type="number" inputMode="numeric" min={1} required value={montant} onChange={(e) => setMontant(e.target.value)} className={input} /></label>
          <div>
            <p className="text-sm font-semibold">
              Justificatif (photo de la facture ou du reçu){montantNum >= SEUIL_JUSTIFICATIF ? <span className="text-brand-red"> · obligatoire</span> : " · facultatif"}
            </p>
            {justificatif ? (
              <div className="relative mt-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={justificatif} alt="Justificatif" className="max-h-48 w-full rounded-xl border border-line object-contain" />
                <button type="button" onClick={() => setJustificatif("")} aria-label="Retirer" className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"><X size={14} /></button>
              </div>
            ) : (
              <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-4 text-sm text-muted">
                <ImagePlus size={18} /> Ajouter une photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setJustificatif(await reduireImage(f, 1100, 0.7).catch(() => ""));
                  }}
                />
              </label>
            )}
          </div>
          <button disabled={occupe} className="btn-gold w-full">Enregistrer la dépense</button>
        </form>
      )}

      <div className="space-y-2">
        {depenses.length === 0 && <p className="card p-6 text-center text-muted">Aucune dépense enregistrée.</p>}
        {depenses.map((d) => {
          const enAttenteApprob = d.statut === "a_approuver" && !d.annulee;
          return (
            <div key={d.id} className={`card space-y-2 p-4 ${d.annulee ? "opacity-60" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${d.annulee ? "line-through" : ""}`}>{d.libelle}</p>
                  <p className="text-xs text-muted">{new Date(d.date).toLocaleDateString("fr-FR")} · {d.categorie}{d.saisiPar ? ` · saisi par ${d.saisiPar}` : ""}{d.approuveNom ? ` · approuvé par ${d.approuveNom}` : ""}</p>
                </div>
                <p className={`font-semibold tabular-nums ${d.annulee ? "line-through" : ""}`}>{fcfa(d.montant)}</p>
              </div>
              {d.annulee && <p className="text-xs font-semibold text-muted">Annulée : {d.motifAnnulation}</p>}
              {enAttenteApprob && (
                <div className="space-y-2 rounded-xl bg-gold-500/10 p-3 text-sm">
                  <p className="font-semibold text-gold-700">En attente d’approbation (double contrôle)</p>
                  {peutApprouver && d.saisiUid !== uid ? (
                    <button onClick={() => approuver(d)} disabled={occupe} className="btn-gold w-full">Approuver cette dépense</button>
                  ) : (
                    <p className="text-xs text-muted">Une autre personne de l’équipe doit l’approuver.</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                {d.aJustificatif ? (
                  <button onClick={() => voirJustificatif(d.id)} className="font-semibold text-gold-700 underline">{vu?.id === d.id ? "Masquer le justificatif" : "Voir le justificatif"}</button>
                ) : (
                  <span className="text-xs text-muted">Sans justificatif</span>
                )}
                {gere && !d.annulee && aAnnuler !== d.id && (
                  <button onClick={() => { setAAnnuler(d.id); setMotifAnnul(""); }} className="ml-auto text-xs font-semibold text-brand-red underline">Annuler</button>
                )}
              </div>
              {gere && aAnnuler === d.id && (
                <div className="space-y-2 rounded-xl bg-brand-red/5 p-3">
                  <input value={motifAnnul} onChange={(e) => setMotifAnnul(e.target.value)} placeholder="Raison de l’annulation" className={input} />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => annuler(d)} disabled={occupe} className="btn-outline">Confirmer</button>
                    <button onClick={() => setAAnnuler(null)} className="btn-outline">Garder</button>
                  </div>
                </div>
              )}
              {vu?.id === d.id && (vu.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vu.image} alt="Justificatif" className="max-h-96 w-full rounded-xl border border-line object-contain" />
              ) : (
                <p className="text-xs text-muted">Justificatif introuvable.</p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JournalOnglet({ journal, totaux }: { journal: LigneJournal[]; totaux: Totaux }) {
  let cumul = 0;
  const lignes = journal.map((l) => {
    cumul += l.sens === "entree" ? l.montant : -l.montant;
    return { ...l, solde: cumul };
  });
  const attendu = totaux.encaisse - totaux.depense;
  const ecart = attendu - cumul;
  const jour = (l: LigneJournal) => (l.creeLe ? new Date(l.creeLe.seconds * 1000) : null);

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3 text-sm ${ecart === 0 ? "bg-[#E3F0DC] text-[#3C7026]" : "bg-brand-red/10 text-brand-red"}`}>
        {ecart === 0
          ? `Contrôle : le journal (${fcfa(cumul)}) correspond exactement au solde des comptes.`
          : `Écart de ${fcfa(ecart)} entre le solde des comptes (${fcfa(attendu)}) et le journal (${fcfa(cumul)}). À expliquer : ce peut être une opération faite avant la mise en place du journal.`}
      </div>
      <p className="text-xs text-muted">Le journal garde chaque entrée et chaque sortie d’argent. Il ne peut être ni modifié ni effacé : une erreur se corrige par une annulation, qui ajoute une ligne.</p>
      {lignes.length === 0 && <p className="card p-6 text-center text-muted">Aucune opération dans le journal.</p>}
      <div className="space-y-2">
        {[...lignes].reverse().map((l) => {
          const j = jour(l);
          return (
            <div key={l.id} className="card flex items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.libelle}</p>
                <p className="text-xs text-muted">
                  {j ? `${j.getDate()} ${MOIS[j.getMonth()]} ${j.getFullYear()}` : "à l’instant"} · {l.categorie}{l.ref ? ` · ${l.ref}` : ""}{l.acteurNom ? ` · ${l.acteurNom}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold tabular-nums ${l.sens === "entree" ? "text-emerald-700" : "text-brand-red"}`}>{l.sens === "entree" ? "+" : "−"}{fcfa(l.montant)}</p>
                <p className="text-xs tabular-nums text-muted">solde {fcfa(l.solde)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControleOnglet({ rapprochements, soldeCalcule, acteurNom, acteurUid, setMessage, recharger }: { rapprochements: Rapprochement[]; soldeCalcule: number; acteurNom: string; acteurUid: string; setMessage: (m: string) => void; recharger: () => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reel, setReel] = useState("");
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState(false);
  const reelNum = reel === "" ? null : Math.round(Number(reel));
  const ecart = reelNum === null ? null : reelNum - soldeCalcule;
  const dernier = rapprochements[0];
  const jours = dernier?.creeLe ? Math.floor((Date.now() - dernier.creeLe.seconds * 1000) / 86400000) : null;

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (reelNum === null || Number.isNaN(reelNum)) return setMessage("Indiquez le solde réel affiché sur le compte Orange Money.");
    setOccupe(true);
    setMessage("");
    try {
      await addDoc(collection(db, "rapprochements"), {
        date,
        soldeCalcule,
        soldeReel: reelNum,
        ecart: reelNum - soldeCalcule,
        note: note.trim(),
        acteurUid,
        acteurNom,
        creeLe: serverTimestamp(),
      });
      setReel("");
      setNote("");
    } catch {
      setMessage("Le rapprochement n’a pas pu être enregistré.");
    }
    await recharger();
    setOccupe(false);
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-3 text-sm ${jours === null || jours > 35 ? "bg-gold-500/10" : "bg-[#E3F0DC] text-[#3C7026]"}`}>
        {jours === null
          ? "Aucun rapprochement pour l’instant. Faites-en un chaque mois : c’est la meilleure protection contre les erreurs."
          : jours > 35
            ? `Le dernier rapprochement date de ${jours} jours : il est temps d’en faire un.`
            : `Dernier rapprochement il y a ${jours} jour${jours > 1 ? "s" : ""}.`}
      </div>

      <form onSubmit={enregistrer} className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold">Comparer avec le compte Orange Money</h2>
        <p className="text-xs text-muted">Ouvrez l’application Orange Money du numéro de la caisse, lisez le solde affiché, et saisissez-le ici. L’application le compare au solde calculé.</p>
        <div className="flex items-center justify-between rounded-xl border border-line p-3 text-sm">
          <span>Solde calculé par l’application</span>
          <span className="font-semibold tabular-nums">{fcfa(soldeCalcule)}</span>
        </div>
        <label className="block text-sm font-semibold">Date du constat<input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
        <label className="block text-sm font-semibold">Solde réel sur Orange Money (FCFA)<input type="number" inputMode="numeric" required value={reel} onChange={(e) => setReel(e.target.value)} className={input} /></label>
        {ecart !== null && (
          <div className={`rounded-xl p-3 text-sm font-semibold ${ecart === 0 ? "bg-[#E3F0DC] text-[#3C7026]" : "bg-brand-red/10 text-brand-red"}`}>
            {ecart === 0 ? "Aucun écart : les comptes sont justes." : `Écart de ${ecart > 0 ? "+" : "−"}${fcfa(Math.abs(ecart))} (${ecart > 0 ? "il y a plus d’argent que prévu" : "il manque de l’argent"}).`}
          </div>
        )}
        <label className="block text-sm font-semibold">Note (explication d’un écart, frais de retrait…)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={input} /></label>
        <button disabled={occupe} className="btn-gold w-full">Enregistrer ce rapprochement</button>
        <p className="text-xs text-muted">Un rapprochement enregistré ne peut plus être modifié. Les frais de retrait ou de transfert Orange Money créent souvent de petits écarts : notez-les comme dépense « Frais de gestion de la caisse ».</p>
      </form>

      <section className="space-y-2">
        <h2 className="font-display text-base font-bold">Historique</h2>
        {rapprochements.length === 0 && <p className="card p-4 text-center text-sm text-muted">Aucun rapprochement enregistré.</p>}
        {rapprochements.map((r) => (
          <div key={r.id} className="card flex items-center gap-3 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{new Date(r.date).toLocaleDateString("fr-FR")}</p>
              <p className="text-xs text-muted">Calculé {fcfa(r.soldeCalcule)} · réel {fcfa(r.soldeReel)}{r.acteurNom ? ` · ${r.acteurNom}` : ""}</p>
              {r.note && <p className="text-xs">{r.note}</p>}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.ecart === 0 ? "bg-[#E3F0DC] text-[#3C7026]" : "bg-brand-red/15 text-brand-red"}`}>
              {r.ecart === 0 ? "Aucun écart" : `${r.ecart > 0 ? "+" : "−"}${fcfa(Math.abs(r.ecart))}`}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

interface DonLigne {
  id: string;
  date: string;
  donateurAffiche: string;
  montant: number;
  recu: string;
  note?: string;
  annulee?: boolean;
}

/** Dons et sponsoring : saisis par la trésorerie. Le nom réel n'est écrit que dans le journal (équipe) ; les membres voient « Anonyme » si le donateur le souhaite. */
function DonsOnglet({ gere, occupe, setOccupe, setMessage, recharger, acteurNom, acteurUid }: Commun & { acteurNom: string; acteurUid: string }) {
  const [dons, setDons] = useState<DonLigne[] | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [donateur, setDonateur] = useState("");
  const [anonyme, setAnonyme] = useState(false);
  const [montant, setMontant] = useState("");
  const [note, setNote] = useState("");
  const [aAnnuler, setAAnnuler] = useState<string | null>(null);
  const [motifAnnul, setMotifAnnul] = useState("");

  const lire = useCallback(async () => {
    try {
      const r = await getDocs(query(collection(db, "dons"), orderBy("date", "desc"), limit(50)));
      setDons(r.docs.map((d) => ({ ...(d.data() as Omit<DonLigne, "id">), id: d.id })));
    } catch {
      setDons([]);
      setMessage("Impossible de lire les dons. Vérifiez que les règles de sécurité sont à jour.");
    }
  }, [setMessage]);
  useEffect(() => {
    lire();
  }, [lire]);

  async function enregistrer() {
    const m = Math.round(Number(montant.replace(/\s/g, "")));
    if (!donateur.trim()) return setMessage("Indiquez le nom du donateur ou du sponsor.");
    if (!Number.isFinite(m) || m <= 0) return setMessage("Indiquez un montant valide.");
    setOccupe(true);
    setMessage("");
    try {
      const annee = Number(date.slice(0, 4)) || new Date().getFullYear();
      await runTransaction(db, async (tx) => {
        const gref = doc(db, "caisse_totaux", "global");
        const gsnap = await tx.get(gref);
        const numero = (gsnap.exists() ? Number(gsnap.data().compteurDons) || 0 : 0) + 1;
        const recu = `DON-${annee}-${String(numero).padStart(4, "0")}`;
        const dref = doc(collection(db, "dons"));
        tx.set(dref, {
          date,
          donateurAffiche: anonyme ? "Anonyme" : donateur.trim(),
          montant: m,
          recu,
          note: note.trim(),
          annulee: false,
          saisiPar: acteurNom,
          saisiUid: acteurUid,
          creeLe: serverTimestamp(),
        });
        tx.set(gref, { encaisse: increment(m), compteurDons: numero }, { merge: true });
        const j = ligneJournal({ sens: "entree", montant: m, libelle: `Don de ${donateur.trim()}${anonyme ? " (anonyme pour les membres)" : ""}`, categorie: "Don", ref: recu, acteurUid, acteurNom });
        tx.set(j.ref, j.data);
      });
      setDonateur("");
      setMontant("");
      setNote("");
      setAnonyme(false);
      await lire();
      await recharger();
    } catch {
      setMessage("L’enregistrement du don a échoué. Réessayez.");
    }
    setOccupe(false);
  }

  async function annuler(d: DonLigne) {
    if (!motifAnnul.trim()) return setMessage("Indiquez le motif de l’annulation.");
    setOccupe(true);
    setMessage("");
    try {
      await runTransaction(db, async (tx) => {
        const dref = doc(db, "dons", d.id);
        const s = await tx.get(dref);
        if (!s.exists() || s.data().annulee) throw new Error("deja");
        tx.update(dref, { annulee: true, motifAnnulation: motifAnnul.trim(), annuleLe: serverTimestamp() });
        tx.set(doc(db, "caisse_totaux", "global"), { encaisse: increment(-d.montant) }, { merge: true });
        const j = ligneJournal({ sens: "sortie", montant: d.montant, libelle: `Annulation du don ${d.recu} : ${motifAnnul.trim()}`, categorie: "Annulation", ref: d.recu, acteurUid, acteurNom });
        tx.set(j.ref, j.data);
      });
      setAAnnuler(null);
      setMotifAnnul("");
      await lire();
      await recharger();
    } catch {
      setMessage("L’annulation a échoué. Réessayez.");
    }
    setOccupe(false);
  }

  return (
    <div className="space-y-4">
      {gere ? (
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Enregistrer un don ou un sponsoring</h2>
          <p className="text-xs text-muted">À saisir après avoir vérifié la réception sur le numéro de la caisse. Un don augmente le solde mais ne compte pas comme cotisation.</p>
          <label className="block text-sm font-semibold">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-semibold">Donateur ou sponsor
            <input value={donateur} onChange={(e) => setDonateur(e.target.value)} className={input} placeholder="Nom de la personne ou de l’entreprise" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={anonyme} onChange={(e) => setAnonyme(e.target.checked)} />
            Le donateur souhaite rester anonyme pour les membres (l’équipe de la caisse voit le nom dans le journal)
          </label>
          <label className="block text-sm font-semibold">Montant (FCFA)
            <input inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value)} className={input} placeholder="Ex. 25000" />
          </label>
          <label className="block text-sm font-semibold">Note (facultatif)
            <input value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder="Ex. pour le barbecue, sans affectation…" />
          </label>
          <button onClick={enregistrer} disabled={occupe} className="btn-gold w-full">Enregistrer le don</button>
        </section>
      ) : (
        <div className="rounded-xl bg-gold-500/10 p-3 text-sm">Seuls le trésorier et les administrateurs peuvent enregistrer un don.</div>
      )}
      <section className="card space-y-2 p-5">
        <h2 className="font-display text-base font-bold">Dons enregistrés</h2>
        {dons === null ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : dons.length === 0 ? (
          <p className="text-sm text-muted">Aucun don pour l’instant.</p>
        ) : (
          dons.map((d) => (
            <div key={d.id} className={`space-y-2 rounded-xl border border-line p-3 text-sm ${d.annulee ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{d.donateurAffiche}{d.annulee ? " (annulé)" : ""}</p>
                  <p className="text-xs text-muted">{new Date(d.date).toLocaleDateString("fr-FR")} · {d.recu}{d.note ? ` · ${d.note}` : ""}</p>
                </div>
                <p className="font-semibold tabular-nums">{fcfa(d.montant)}</p>
                {gere && !d.annulee && (
                  <button onClick={() => setAAnnuler(aAnnuler === d.id ? null : d.id)} aria-label="Annuler ce don" className="text-muted"><X size={18} /></button>
                )}
              </div>
              {aAnnuler === d.id && (
                <div className="space-y-2">
                  <input value={motifAnnul} onChange={(e) => setMotifAnnul(e.target.value)} className={input} placeholder="Motif de l’annulation (erreur de saisie…)" />
                  <button onClick={() => annuler(d)} disabled={occupe} className="btn-outline w-full">Confirmer l’annulation</button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function SuiviOnglet({ membres, cotisants, annee }: { membres: MembreLeger[]; cotisants: Cotisant[]; annee: number }) {
  const parUid = useMemo(() => new Map(cotisants.map((c) => [c.uid, c])), [cotisants]);
  const nonCotisants = membres.filter((m) => !parUid.has(m.uid));
  const cot = membres.filter((m) => parUid.has(m.uid));
  const aJour = cot.filter((m) => statutCotisation(parUid.get(m.uid)!.moisCouverts, annee).aJour);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3"><p className="font-display text-lg font-bold">{aJour.length}</p><p className="text-xs text-muted">À jour</p></div>
        <div className="card p-3"><p className="font-display text-lg font-bold">{cot.length - aJour.length}</p><p className="text-xs text-muted">En cours</p></div>
        <div className="card p-3"><p className="font-display text-lg font-bold">{nonCotisants.length}</p><p className="text-xs text-muted">Pas cotisé</p></div>
      </div>
      <section className="card space-y-2 p-4">
        <h2 className="font-display text-base font-bold">Ont cotisé ({cot.length})</h2>
        {cot.length === 0 && <p className="text-sm text-muted">Personne pour l’instant.</p>}
        {cot.map((m) => {
          const s = statutCotisation(parUid.get(m.uid)!.moisCouverts, annee);
          const texte = s.aJour
            ? `Bonjour ${m.prenom}, merci pour votre cotisation à la caisse solidaire RRTE : vous êtes à jour. ${s.texte}. Que Dieu vous le rende !`
            : `Bonjour ${m.prenom}, petit rappel amical : votre cotisation à la caisse solidaire RRTE arrive à échéance (${s.texte.toLowerCase()}). Vous pouvez la renouveler dans l’application, rubrique Caisse solidaire. Merci !`;
          const lien = lienWhatsAppVers(m.telephone, texte);
          return (
            <div key={m.uid} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{m.prenom} {m.nom}</span>
              <span className={`text-xs ${s.aJour ? "font-semibold text-emerald-700" : "text-muted"}`}>{s.texte}</span>
              {lien ? (
                <a href={lien} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-gold-700">
                  <MessageCircle size={14} /> {s.aJour ? "Remercier" : "Relancer"}
                </a>
              ) : (
                <span className="text-xs text-muted">Pas de numéro</span>
              )}
            </div>
          );
        })}
      </section>
      <section className="card space-y-2 p-4">
        <h2 className="font-display text-base font-bold">Pas encore cotisé ({nonCotisants.length})</h2>
        <p className="text-xs text-muted">Visible de l’équipe de la caisse et des administrateurs seulement.</p>
        {nonCotisants.map((m) => {
          const lien = lienWhatsAppVers(
            m.telephone,
            `Bonjour ${m.prenom}, la caisse solidaire RRTE est ouverte : cotisation de ${fcfa(MONTANT_MENSUEL)} par mois, à régler par trimestre, semestre ou année. Elle est volontaire. Les détails et le paiement sont dans l’application, rubrique Caisse solidaire. Merci !`
          );
          return (
            <div key={m.uid} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{m.prenom} {m.nom}</span>
              {lien ? (
                <a href={lien} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-gold-700">
                  <MessageCircle size={14} /> Inviter
                </a>
              ) : (
                <span className="text-xs text-muted">Pas de numéro</span>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function EquipeOnglet({ equipe, comite, plafond, membres, setMessage, recharger }: { equipe: Equipier[]; comite: Equipier[]; plafond?: number; membres: MembreLeger[]; setMessage: (m: string) => void; recharger: () => Promise<void> }) {
  const [choix, setChoix] = useState("");
  const [role, setRole] = useState<"tresorier" | "controleur">("tresorier");
  const [choixComite, setChoixComite] = useState("");
  const [plafondSaisi, setPlafondSaisi] = useState(plafond ? String(plafond) : "");

  async function ajouterComite() {
    const m = membres.find((x) => x.uid === choixComite);
    if (!m) return;
    try {
      await setDoc(doc(db, "caisse_comite", m.uid), { uid: m.uid, nom: `${m.prenom} ${m.nom}`.trim(), ajouteLe: serverTimestamp() });
      setChoixComite("");
    } catch {
      setMessage("L’ajout au comité a échoué.");
    }
    await recharger();
  }

  async function retirerComite(u: string) {
    try {
      await deleteDoc(doc(db, "caisse_comite", u));
    } catch {
      setMessage("Le retrait a échoué.");
    }
    await recharger();
  }

  async function enregistrerPlafond() {
    const m = Math.round(Number(plafondSaisi));
    try {
      await setDoc(doc(db, "caisse_config", "parametres"), { plafondAide: m > 0 ? m : null }, { merge: true });
    } catch {
      setMessage("Le plafond n’a pas pu être enregistré.");
    }
    await recharger();
  }

  async function ajouter() {
    const m = membres.find((x) => x.uid === choix);
    if (!m) return;
    try {
      await setDoc(doc(db, "caisse_tresoriers", m.uid), { uid: m.uid, nom: `${m.prenom} ${m.nom}`.trim(), role, ajouteLe: serverTimestamp() });
      setChoix("");
    } catch {
      setMessage("L’ajout a échoué.");
    }
    await recharger();
  }

  async function retirer(u: string) {
    try {
      await deleteDoc(doc(db, "caisse_tresoriers", u));
    } catch {
      setMessage("Le retrait a échoué.");
    }
    await recharger();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gold-500/10 p-3 text-sm">
        Deux personnes sont recommandées : un <b>trésorier</b> qui valide les paiements et note les dépenses, et un <b>contrôleur</b> qui consulte les comptes sans pouvoir les modifier.
      </div>
      <section className="card space-y-2 p-4">
        <h2 className="font-display text-base font-bold">Équipe actuelle</h2>
        {equipe.length === 0 && <p className="text-sm text-muted">Personne n’est nommé : seuls les administrateurs gèrent la caisse.</p>}
        {equipe.map((e) => (
          <div key={e.uid} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{e.nom}</span>
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">{e.role === "tresorier" ? "Trésorier" : "Contrôleur"}</span>
            <button onClick={() => retirer(e.uid)} aria-label="Retirer" className="text-muted"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>
      <section className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold">Nommer une personne</h2>
        <select value={choix} onChange={(e) => setChoix(e.target.value)} className={input}>
          <option value="">Choisir un membre…</option>
          {membres.map((m) => <option key={m.uid} value={m.uid}>{m.prenom} {m.nom}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value as "tresorier" | "controleur")} className={input}>
          <option value="tresorier">Trésorier (valide et note les dépenses)</option>
          <option value="controleur">Contrôleur (consultation)</option>
        </select>
        <button onClick={ajouter} disabled={!choix} className="btn-gold w-full">Nommer</button>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold">Comité d’aide ({comite.length}/5 minimum)</h2>
        <p className="text-xs text-muted">Le comité vote sur les demandes d’aide. Il doit compter au moins 5 personnes pour que les décisions soient possibles.</p>
        {comite.map((e) => (
          <div key={e.uid} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{e.nom}</span>
            <button onClick={() => retirerComite(e.uid)} aria-label="Retirer du comité" className="text-muted"><Trash2 size={16} /></button>
          </div>
        ))}
        <select value={choixComite} onChange={(e) => setChoixComite(e.target.value)} className={input}>
          <option value="">Ajouter un membre au comité…</option>
          {membres.filter((m) => !comite.some((c) => c.uid === m.uid)).map((m) => <option key={m.uid} value={m.uid}>{m.prenom} {m.nom}</option>)}
        </select>
        <button onClick={ajouterComite} disabled={!choixComite} className="btn-gold w-full">Ajouter au comité</button>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-display text-base font-bold">Plafond d’une aide</h2>
        <p className="text-xs text-muted">Montant maximum qu’une aide peut atteindre, fixé par le comité. Laissez vide pour ne pas fixer de plafond.</p>
        <input type="number" inputMode="numeric" min={0} value={plafondSaisi} onChange={(e) => setPlafondSaisi(e.target.value)} placeholder="Ex. : 100000" className={input} />
        <button onClick={enregistrerPlafond} className="btn-gold w-full">Enregistrer le plafond</button>
      </section>
    </div>
  );
}

export default function GestionCaissePage() {
  return (
    <CaisseAcces>
      <GestionContenu />
    </CaisseAcces>
  );
}
