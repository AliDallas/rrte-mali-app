"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  QuerySnapshot, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { AlertTriangle, CheckCircle2, ChevronLeft, Plus, Vote } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  CAISSE_VISIBLE_MEMBRES, DemandeAide, LIBELLE_STATUT_AIDE, ParametresCaisse, SEUIL_DOUBLE_CONTROLE, VoteAide, fcfa,
} from "@/lib/caisse";
import { opsNouvelleDepense } from "@/lib/caisseOps";

const input = "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
const MIN_COMITE = 5;
const parDate = (a: DemandeAide, b: DemandeAide) => (b.creeLe?.seconds ?? 0) - (a.creeLe?.seconds ?? 0);

function Pastille({ statut }: { statut: DemandeAide["statut"] }) {
  const couleur =
    statut === "refusee" ? "bg-brand-red/15 text-brand-red" : statut === "nouvelle" ? "bg-gold-100 text-gold-700" : "bg-[#E3F0DC] text-[#3C7026]";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${couleur}`}>{LIBELLE_STATUT_AIDE[statut]}</span>;
}

function Contenu() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const admin = profile?.role === "admin";
  const [comite, setComite] = useState<string[]>([]);
  const [roleCaisse, setRoleCaisse] = useState<string | null>(null);
  const [params, setParams] = useState<ParametresCaisse>({});
  const [demandes, setDemandes] = useState<DemandeAide[] | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [votes, setVotes] = useState<VoteAide[]>([]);
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);

  const membreComite = !!uid && comite.includes(uid);
  const voit = admin || (CAISSE_VISIBLE_MEMBRES && membreComite);
  const gere = admin || (CAISSE_VISIBLE_MEMBRES && roleCaisse === "tresorier");

  const charger = useCallback(async () => {
    if (!uid) return;
    try {
      const [c, p, t] = await Promise.all([
        getDocs(collection(db, "caisse_comite")),
        getDoc(doc(db, "caisse_config", "parametres")),
        getDoc(doc(db, "caisse_tresoriers", uid)),
      ]);
      const ids = c.docs.map((d) => d.id);
      setComite(ids);
      setParams(p.exists() ? (p.data() as ParametresCaisse) : {});
      setRoleCaisse(t.exists() ? ((t.data().role as string) ?? null) : null);
      const toutes = admin || ids.includes(uid);
      const r: QuerySnapshot = toutes
        ? await getDocs(collection(db, "aides"))
        : await getDocs(query(collection(db, "aides"), where("uid", "==", uid)));
      setDemandes(r.docs.map((d) => ({ ...(d.data() as DemandeAide), id: d.id })).sort(parDate));
    } catch {
      setDemandes([]);
    }
  }, [uid, admin]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function ouvrir(d: DemandeAide) {
    if (ouvert === d.id) return setOuvert(null);
    setOuvert(d.id);
    setMontant(d.montantDemande ? String(d.montantDemande) : "");
    setMotif("");
    setMessage("");
    setVotes([]);
    if (voit) {
      try {
        const r = await getDocs(collection(db, "aides", d.id, "votes"));
        setVotes(r.docs.map((v) => v.data() as VoteAide));
      } catch {
        /* ignoré */
      }
    }
  }

  async function voter(d: DemandeAide, vote: VoteAide["vote"]) {
    if (!uid || !profile) return;
    await setDoc(doc(db, "aides", d.id, "votes", uid), { uid, nom: `${profile.prenom} ${profile.nom}`.trim(), vote, at: serverTimestamp() });
    const r = await getDocs(collection(db, "aides", d.id, "votes"));
    setVotes(r.docs.map((v) => v.data() as VoteAide));
  }

  async function decider(d: DemandeAide, statut: "accordee" | "refusee") {
    setMessage("");
    const m = Math.round(Number(montant));
    if (statut === "accordee") {
      if (!(m > 0)) return setMessage("Indiquez le montant accordé.");
      if (params.plafondAide && m > params.plafondAide) return setMessage(`Le montant dépasse le plafond fixé (${fcfa(params.plafondAide)}).`);
    }
    if (!motif.trim()) return setMessage("Indiquez le motif de la décision.");
    setOccupe(true);
    try {
      await updateDoc(doc(db, "aides", d.id), {
        statut,
        motifDecision: motif.trim(),
        ...(statut === "accordee" ? { montantAccorde: m } : {}),
        decideLe: serverTimestamp(),
        decidePar: uid ?? "",
      });
      setOuvert(null);
    } catch {
      setMessage("L’enregistrement a échoué.");
    }
    await charger();
    setOccupe(false);
  }

  async function verser(d: DemandeAide) {
    if (!d.montantAccorde || !uid) return;
    setOccupe(true);
    setMessage("");
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "aides", d.id), { statut: "versee", verseLe: serverTimestamp() });
      const r = opsNouvelleDepense(batch, {
        date: new Date().toISOString().slice(0, 10),
        libelle: `Aide sociale : ${d.type.toLowerCase()}`,
        categorie: "Aide sociale",
        montant: d.montantAccorde,
        saisiPar: `${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim(),
        saisiUid: uid,
        aideId: d.id,
      });
      await batch.commit();
      if (r.statut === "a_approuver") setMessage(`Versement enregistré. Il atteint ${fcfa(SEUIL_DOUBLE_CONTROLE)} : une autre personne de l’équipe doit l’approuver dans Gestion de la caisse > Dépenses.`);
    } catch {
      setMessage("Le versement n’a pas pu être enregistré.");
    }
    await charger();
    setOccupe(false);
  }

  const n = comite.length;
  const tally = (v: VoteAide["vote"]) => votes.filter((x) => x.vote === v).length;
  const pour = tally("pour");
  const contre = tally("contre");
  const majorite = n > 0 && pour * 2 > n;
  const refusPossible = n > 0 && (contre * 2 >= n || votes.length === n);
  const mesDemandes = (demandes ?? []).filter((d) => d.uid === uid);
  const aEtudier = (demandes ?? []).filter((d) => d.statut === "nouvelle");
  const traitees = (demandes ?? []).filter((d) => d.statut !== "nouvelle");

  function detailJsx(d: DemandeAide) {
    const monVote = votes.find((v) => v.uid === uid)?.vote;
    return (
      <div className="space-y-3 border-t border-line pt-3">
        <p className="whitespace-pre-line text-[15px]">{d.description}</p>
        <p className="text-xs text-muted">{d.nom}{d.telephone ? ` · ${d.telephone}` : ""}{d.montantDemande ? ` · souhaite ${fcfa(d.montantDemande)}` : ""}</p>
        {d.statut !== "nouvelle" && d.motifDecision && (
          <p className="rounded-xl bg-gold-500/10 p-3 text-sm"><b>Décision :</b> {d.montantAccorde ? `${fcfa(d.montantAccorde)} accordés. ` : ""}{d.motifDecision}</p>
        )}
        {d.statut === "nouvelle" && voit && (
          <>
            <div className="rounded-xl border border-line p-3 text-sm">
              <p className="font-semibold">Votes du comité ({votes.length}/{n})</p>
              <p className="text-muted">Pour : {pour} · Contre : {contre} · Abstention : {tally("abstention")}</p>
              {votes.map((v) => <p key={v.uid} className="text-xs text-muted">{v.nom} : {v.vote}</p>)}
              {n < MIN_COMITE && <p className="mt-1 text-xs text-brand-red">Le comité compte {n} personne(s) : il en faut au moins {MIN_COMITE}.</p>}
            </div>
            {membreComite && (
              <div className="grid grid-cols-3 gap-2">
                {(["pour", "contre", "abstention"] as const).map((v) => (
                  <button key={v} onClick={() => voter(d, v)} className={`rounded-xl px-2 py-2.5 text-sm font-semibold ${monVote === v ? "bg-ink text-ink-fg" : "border border-line"}`}>
                    {v === "pour" ? "Pour" : v === "contre" ? "Contre" : "Abstention"}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-semibold">
                Montant accordé (FCFA){params.plafondAide ? `, plafond ${fcfa(params.plafondAide)}` : ""}
                <input type="number" inputMode="numeric" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className={input} />
              </label>
              <label className="block text-sm font-semibold">
                Motif de la décision
                <textarea rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} className={input} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => decider(d, "accordee")} disabled={occupe || !majorite || n < MIN_COMITE} className="btn-gold disabled:opacity-40">Accorder</button>
                <button onClick={() => decider(d, "refusee")} disabled={occupe || !refusPossible || n < MIN_COMITE} className="btn-outline disabled:opacity-40">Refuser</button>
              </div>
              <p className="text-xs text-muted">
                « Accorder » est possible quand la majorité des membres du comité a voté pour. « Refuser » quand la moitié a voté contre ou que tous ont voté.
              </p>
            </div>
          </>
        )}
        {d.statut === "accordee" && gere && (
          <button onClick={() => verser(d)} disabled={occupe} className="btn-gold w-full">Enregistrer le versement ({fcfa(d.montantAccorde ?? 0)})</button>
        )}
        {message && <p className="text-sm text-brand-red">{message}</p>}
      </div>
    );
  }

  const ligne = (d: DemandeAide, detail: boolean) => (
    <div key={d.id} className="card space-y-3 p-4">
      <button onClick={() => (detail ? ouvrir(d) : setOuvert(ouvert === d.id ? null : d.id))} className="flex w-full items-center gap-3 text-left">
        {d.urgence === "urgent" && <AlertTriangle size={18} className="flex-none text-brand-red" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{d.type}{detail ? ` · ${d.nom}` : ""}</p>
          <p className="text-xs text-muted">{d.creeLe ? new Date(d.creeLe.seconds * 1000).toLocaleDateString("fr-FR") : ""}{d.urgence === "urgent" ? " · urgence" : ""}</p>
        </div>
        <Pastille statut={d.statut} />
      </button>
      {ouvert === d.id && detailJsx(d)}
    </div>
  );

  return (
    <AppShell title="Demandes d’aide" subtitle="Caisse solidaire">
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      <div className="space-y-4">
        <Link href="/caisse/aide/nouvelle" className="btn-gold flex items-center justify-center gap-2">
          <Plus size={18} /> Faire une demande d’aide ou d’urgence
        </Link>
        <p className="text-sm text-muted">Votre demande est confidentielle. Le comité d’au moins 5 personnes l’étudie, décide et fixe le montant.</p>

        {voit && (
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 font-display text-base font-bold"><Vote size={18} className="text-gold-700" /> À étudier par le comité ({aEtudier.length})</h2>
            {aEtudier.length === 0 && <p className="card p-4 text-center text-sm text-muted">Aucune demande en attente.</p>}
            {aEtudier.map((d) => ligne(d, true))}
            {traitees.length > 0 && (
              <>
                <h2 className="pt-2 font-display text-base font-bold">Décisions prises</h2>
                {traitees.map((d) => ligne(d, true))}
              </>
            )}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 font-display text-base font-bold"><CheckCircle2 size={18} className="text-gold-700" /> Mes demandes</h2>
          {demandes === null ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : mesDemandes.length === 0 ? (
            <p className="card p-4 text-center text-sm text-muted">Vous n’avez fait aucune demande.</p>
          ) : (
            mesDemandes.map((d) => ligne(d, false))
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function AidePage() {
  return (
    <CaisseAcces>
      <Contenu />
    </CaisseAcces>
  );
}
