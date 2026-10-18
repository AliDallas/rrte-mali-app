"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ChevronLeft, RefreshCw } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { depuis } from "@/lib/fil";

interface Ligne {
  uid: string;
  nom: string;
  vu: number; // ms, 0 si jamais vu
}

export default function ActivitePage() {
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  const [erreur, setErreur] = useState("");

  async function charger() {
    setErreur("");
    try {
      const [pres, membres] = await Promise.all([getDocs(collection(db, "presence")), getDocs(query(collection(db, "users"), where("statut", "==", "actif")))]);
      const vus = new Map<string, number>();
      pres.docs.forEach((d) => {
        const t = d.data().vuLe as { seconds?: number } | undefined;
        vus.set(d.id, t?.seconds ? t.seconds * 1000 : 0);
      });
      setLignes(
        membres.docs
          .map((d) => {
            const x = d.data();
            return { uid: d.id, nom: `${x.prenom ?? ""} ${x.nom ?? ""}`.trim() || "Membre", vu: vus.get(d.id) ?? 0 };
          })
          .sort((a, b) => b.vu - a.vu || a.nom.localeCompare(b.nom, "fr"))
      );
    } catch {
      setLignes([]);
      setErreur("Impossible de lire l’activité. Vérifiez que les règles de sécurité sont à jour.");
    }
  }

  useEffect(() => {
    if (admin) charger();
  }, [admin]);

  const stats = useMemo(() => {
    const l = lignes ?? [];
    const maintenant = Date.now();
    const minuit = new Date();
    minuit.setHours(0, 0, 0, 0);
    return {
      total: l.length,
      enLigne: l.filter((x) => x.vu && maintenant - x.vu < 6 * 60 * 1000).length,
      aujourdhui: l.filter((x) => x.vu >= minuit.getTime()).length,
      semaine: l.filter((x) => x.vu && maintenant - x.vu < 7 * 24 * 3600 * 1000).length,
      jamais: l.filter((x) => !x.vu).length,
    };
  }, [lignes]);

  return (
    <AppShell title="Administration" subtitle="Activité des membres">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!admin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-4">
          {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="card border-2 border-emerald-500 p-3">
              <p className="font-display text-2xl font-bold tabular-nums">{lignes ? stats.enLigne : "…"}</p>
              <p className="text-xs text-muted">En ligne maintenant</p>
            </div>
            <div className="card p-3">
              <p className="font-display text-2xl font-bold tabular-nums">{lignes ? stats.aujourdhui : "…"}</p>
              <p className="text-xs text-muted">Vus aujourd’hui</p>
            </div>
            <div className="card p-3">
              <p className="font-display text-2xl font-bold tabular-nums">{lignes ? stats.semaine : "…"}</p>
              <p className="text-xs text-muted">Vus cette semaine</p>
            </div>
            <div className="card p-3">
              <p className="font-display text-2xl font-bold tabular-nums">{lignes ? `${stats.jamais}/${stats.total}` : "…"}</p>
              <p className="text-xs text-muted">Pas encore vus</p>
            </div>
          </div>
          <button onClick={charger} className="btn-outline flex w-full items-center justify-center gap-2">
            <RefreshCw size={16} /> Actualiser
          </button>
          <section className="card space-y-1 p-4">
            <h2 className="font-display text-base font-bold">Dernière connexion de chaque membre</h2>
            <p className="pb-2 text-xs text-muted">
              Le suivi commence à la mise en ligne de cette fonction : « Pas encore vu » veut dire pas vu depuis. L’historique plus ancien est dans la console Firebase, rubrique Authentication.
              Visible des administrateurs seulement.
            </p>
            {lignes === null && <p className="text-sm text-muted">Chargement…</p>}
            {(lignes ?? []).map((x) => (
              <div key={x.uid} className="flex items-center gap-3 border-t border-line py-2 text-sm">
                <span className="flex-1">{x.nom}</span>
                <span className={`text-xs ${x.vu && Date.now() - x.vu < 6 * 60 * 1000 ? "font-semibold text-emerald-700" : "text-muted"}`}>
                  {x.vu ? (Date.now() - x.vu < 6 * 60 * 1000 ? "En ligne" : depuis(x.vu)) : "Pas encore vu"}
                </span>
              </div>
            ))}
          </section>
        </div>
      )}
    </AppShell>
  );
}
