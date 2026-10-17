"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { ChevronLeft, Copy, Check } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { Cotisant, Depense, Totaux, anneeCaisse, fcfa } from "@/lib/caisse";

interface DonLu {
  donateurAffiche: string;
  montant: number;
  annulee?: boolean;
}

function BilanContenu() {
  const courante = anneeCaisse();
  const annees = useMemo(() => {
    const l: number[] = [];
    for (let a = courante; a >= 2027; a--) l.push(a);
    return l.length ? l : [2027];
  }, [courante]);
  const [annee, setAnnee] = useState(courante);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [cotisants, setCotisants] = useState<Cotisant[] | null>(null);
  const [depenses, setDepenses] = useState<Depense[] | null>(null);
  const [dons, setDons] = useState<DonLu[] | null>(null);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "caisse_totaux", "global"))
      .then((s) => setTotaux(s.exists() ? (s.data() as Totaux) : { encaisse: 0, depense: 0 }))
      .catch(() => setErreur("Impossible de lire les comptes de la caisse."));
  }, []);

  useEffect(() => {
    setCotisants(null);
    setDepenses(null);
    setDons(null);
    getDocs(query(collection(db, "dons"), where("date", ">=", `${annee}-01-01`), where("date", "<=", `${annee}-12-31`), orderBy("date", "desc")))
      .then((r) => setDons(r.docs.map((d) => d.data() as DonLu).filter((d) => !d.annulee)))
      .catch(() => setDons([]));
    getDocs(query(collection(db, "cotisants"), where("annee", "==", annee)))
      .then((r) => setCotisants(r.docs.map((d) => d.data() as Cotisant)))
      .catch(() => setCotisants([]));
    getDocs(query(collection(db, "depenses"), where("date", ">=", `${annee}-01-01`), where("date", "<=", `${annee}-12-31`), orderBy("date", "desc")))
      .then((r) =>
        setDepenses(r.docs.map((d) => ({ ...(d.data() as Depense), id: d.id })).filter((d) => !d.annulee && (d.statut ?? "validee") === "validee"))
      )
      .catch(() => {
        setDepenses([]);
        setErreur("Impossible de lire les dépenses de l’année.");
      });
  }, [annee]);

  const parCategorie = useMemo(() => {
    const m = new Map<string, number>();
    (depenses ?? []).forEach((d) => m.set(d.categorie, (m.get(d.categorie) ?? 0) + d.montant));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [depenses]);
  const totalDepenseAnnee = (depenses ?? []).reduce((s, d) => s + d.montant, 0);
  const totalDons = (dons ?? []).reduce((s, d) => s + d.montant, 0);
  const aide = parCategorie.find(([c]) => c === "Aide sociale")?.[1] ?? 0;
  const solde = (totaux?.encaisse ?? 0) - (totaux?.depense ?? 0);
  const nbCot = cotisants?.length ?? 0;

  const resume = () =>
    [
      `📊 Bilan de la caisse solidaire RRTE – ${annee}`,
      ``,
      `Membres cotisants : ${nbCot}`,
      `Total encaissé depuis l’ouverture : ${totaux ? fcfa(totaux.encaisse) : "…"}`,
      `Dons reçus en ${annee} : ${fcfa(totalDons)}`,
      `Dépenses ${annee} : ${fcfa(totalDepenseAnnee)}`,
      ...parCategorie.map(([c, v]) => `  • ${c} : ${fcfa(v)}`),
      `Aides versées en ${annee} : ${fcfa(aide)}`,
      `Solde actuel : ${totaux ? fcfa(solde) : "…"}`,
      ``,
      `Détail complet dans l’application, rubrique Caisse solidaire. Merci à tous les cotisants !`,
    ].join("\n");

  async function copier() {
    try {
      await navigator.clipboard.writeText(resume());
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setErreur("Copie impossible : sélectionnez le texte ci-dessous à la main.");
    }
  }

  return (
    <AppShell title="Bilan de la caisse" subtitle={`Compte rendu ${annee}`}>
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      <div className="space-y-4">
        {annees.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {annees.map((a) => (
              <button
                key={a}
                onClick={() => setAnnee(a)}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${a === annee ? "border-gold-500 bg-gold-500/15 text-gold-700" : "border-line text-muted"}`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
        {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">En chiffres</h2>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{cotisants === null ? "…" : nbCot}</p>
              <p className="text-xs text-muted">Membres cotisants</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{totaux ? fcfa(totaux.encaisse) : "…"}</p>
              <p className="text-xs text-muted">Encaissé depuis l’ouverture</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{dons === null ? "…" : fcfa(totalDons)}</p>
              <p className="text-xs text-muted">Dons reçus en {annee}{dons && dons.length > 0 ? ` (${dons.length})` : ""}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{depenses === null ? "…" : fcfa(totalDepenseAnnee)}</p>
              <p className="text-xs text-muted">Dépensé en {annee}</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{depenses === null ? "…" : fcfa(aide)}</p>
              <p className="text-xs text-muted">Aides versées en {annee}</p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-gold-500 p-3 text-center">
            <p className="font-display text-lg font-bold tabular-nums">{totaux ? fcfa(solde) : "…"}</p>
            <p className="text-xs text-muted">Solde actuel de la caisse</p>
          </div>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">À quoi l’argent a servi en {annee}</h2>
          {depenses === null ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : parCategorie.length === 0 ? (
            <p className="text-sm text-muted">Aucune dépense enregistrée pour cette année.</p>
          ) : (
            parCategorie.map(([c, v]) => (
              <div key={c} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{c}</span>
                  <span className="font-semibold tabular-nums">{fcfa(v)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${totalDepenseAnnee ? Math.round((v / totalDepenseAnnee) * 100) : 0}%` }} />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Message de compte rendu</h2>
          <p className="text-xs text-muted">Texte prêt à coller dans le groupe WhatsApp.</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-gold-500/10 p-3 text-sm">{resume()}</pre>
          <button onClick={copier} className="btn-outline flex items-center justify-center gap-2">
            {copie ? <Check size={16} /> : <Copy size={16} />} {copie ? "Copié" : "Copier le message"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}

export default function BilanPage() {
  return (
    <CaisseAcces>
      <BilanContenu />
    </CaisseAcces>
  );
}
