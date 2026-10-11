"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { Plus, Search, ThumbsUp } from "lucide-react";
import AppShell from "@/components/AppShell";
import Etoiles from "@/components/Etoiles";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { METIERS, Prestataire, moyenne, prestataireDepuisDoc, visiblePour } from "@/lib/prestataires";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function PrestatairesPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Prestataire[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [metier, setMetier] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Prestataire[]>("prestataires");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "prestataires"))
      .then((r) => {
        const l = r.docs.map((d) => prestataireDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("prestataires", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((p) => visiblePour(p, user?.uid, profile?.role === "admin"))
      .filter((p) => !metier || p.metier === metier)
      .filter((p) => !n || `${p.nom} ${p.metier} ${p.quartier} ${p.description}`.toLowerCase().includes(n))
      .sort((a, b) => moyenne(b) - moyenne(a) || b.nbAvis - a.nbAvis || a.nom.localeCompare(b.nom));
  }, [liste, metier, q, user, profile]);

  return (
    <AppShell title="Recommandés" subtitle="Les contacts de confiance des membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Coiffeur, plombier, quartier…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          value={metier}
          onChange={(e) => setMetier(e.target.value)}
          className="max-w-[40%] rounded-full border border-line bg-white px-3 text-sm"
        >
          <option value="">Tous</option>
          {METIERS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <Link
        href="/prestataires/nouveau"
        className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg"
      >
        <Plus size={16} /> Recommander quelqu’un
      </Link>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <ThumbsUp size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucun contact pour le moment. Recommandez le premier !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((p) => (
          <Link key={p.id} href={`/prestataires/${p.id}`} className="card block p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{p.nom}</p>
                <p className="truncate text-sm text-muted">{[p.metier, p.quartier].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex-none text-right">
                <Etoiles note={moyenne(p)} />
                <p className="text-xs text-muted">
                  {p.nbAvis > 0 ? `${moyenne(p).toFixed(1)} · ${p.nbAvis} avis` : "Pas encore noté"}
                </p>
              </div>
            </div>
            {p.statut === "en_attente" && (
              <p className="mt-2 text-xs font-semibold text-brand-red">En attente de validation</p>
            )}
            {p.ownerNom && <p className="mt-2 text-xs font-semibold text-gold-700">Recommandé par {p.ownerNom}</p>}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
