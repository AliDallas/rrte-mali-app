"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { ChevronLeft, ExternalLink, Flag } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Signalement, signalementDepuisDoc } from "@/lib/signalements";

export default function SignalementsPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [liste, setListe] = useState<Signalement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [voirTraites, setVoirTraites] = useState(false);

  async function charger() {
    const r = await getDocs(collection(db, "signalements"));
    setListe(r.docs.map((d) => signalementDepuisDoc(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt));
    setLoaded(true);
  }

  useEffect(() => {
    if (!isAdmin) return;
    charger().catch(() => setLoaded(true));
  }, [isAdmin]);

  async function marquer(s: Signalement, statut: "nouveau" | "traite") {
    await updateDoc(doc(db, "signalements", s.id), { statut });
    setListe(liste.map((x) => (x.id === s.id ? { ...x, statut } : x)));
  }

  async function supprimer(s: Signalement) {
    await deleteDoc(doc(db, "signalements", s.id));
    setListe(liste.filter((x) => x.id !== s.id));
  }

  // nombre de personnes différentes ayant signalé la même cible
  const parCible: Record<string, number> = {};
  liste.forEach((s) => {
    const k = `${s.cibleType}:${s.cibleId}`;
    parCible[k] = (parCible[k] ?? 0) + 1;
  });
  const affiches = liste.filter((s) => voirTraites || s.statut === "nouveau");

  return (
    <AppShell title="Signalements" subtitle="Comportements signalés par les membres">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={voirTraites} onChange={(e) => setVoirTraites(e.target.checked)} /> Afficher aussi les signalements traités
          </label>
          {loaded && affiches.length === 0 && (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <Flag className="text-gold-600" size={24} />
              <p className="text-muted">Aucun signalement à traiter.</p>
            </div>
          )}
          {affiches.map((s) => {
            const n = parCible[`${s.cibleType}:${s.cibleId}`];
            return (
              <div key={s.id} className={`card space-y-2 border-l-4 p-4 ${s.statut === "nouveau" ? "border-l-brand-red" : "border-l-line"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{s.cibleNom}</p>
                    <p className="text-xs text-muted">{s.cibleType}</p>
                  </div>
                  {n > 1 && <span className="flex-none rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-bold text-white">{n} signalements</span>}
                </div>
                <p className="text-sm font-semibold text-brand-red">{s.motif}</p>
                {s.commentaire && <p className="whitespace-pre-line rounded-xl bg-surface p-3 text-sm">{s.commentaire}</p>}
                <p className="text-xs text-muted">
                  Signalé par {s.auteurNom}
                  {s.createdAt ? ` le ${new Date(s.createdAt).toLocaleDateString("fr-FR")}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {s.chemin && (
                    <Link href={s.chemin} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
                      <ExternalLink size={14} /> Voir
                    </Link>
                  )}
                  {s.statut === "nouveau" ? (
                    <button onClick={() => marquer(s, "traite")} className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-semibold text-ink-fg">
                      Marquer comme traité
                    </button>
                  ) : (
                    <button onClick={() => marquer(s, "nouveau")} className="text-sm text-muted">
                      Rouvrir
                    </button>
                  )}
                  <button onClick={() => supprimer(s)} className="text-sm text-muted">
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
