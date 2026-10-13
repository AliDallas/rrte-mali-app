"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { FileText, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_DEMARCHES, Demarche, LIEUX_DEMARCHES, demarcheDepuisDoc, visibleDemarche } from "@/lib/demarches";
import { dateFr } from "@/lib/voyages";
import { ecrireCache, lireCache } from "@/lib/cache";

const COULEURS = ["bg-brand-red", "bg-brand-blue", "bg-brand-green", "bg-gold-600", "bg-ink-2", "bg-[#EE8A6B]"];

export default function DemarchesPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Demarche[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cat, setCat] = useState("");
  const [lieu, setLieu] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Demarche[]>("demarches");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "demarches"))
      .then((r) => {
        const l = r.docs.map((d) => demarcheDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("demarches", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((d) => visibleDemarche(d, user?.uid, profile?.role === "admin"))
      .filter((d) => !cat || d.categorie === cat)
      .filter((d) => !lieu || d.lieu === lieu)
      .filter((d) => !n || `${d.titre} ${d.categorie} ${d.resume} ${d.etapes} ${d.pieces}`.toLowerCase().includes(n))
      .sort((a, b) => a.categorie.localeCompare(b.categorie) || a.titre.localeCompare(b.titre));
  }, [liste, cat, lieu, q, user, profile]);

  return (
    <AppShell title="Démarches & papiers" subtitle="État civil, mariage, passeport, visas : les guides des membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Passeport, acte, visa…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={lieu} onChange={(e) => setLieu(e.target.value)} className="max-w-[34%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Partout</option>
          {LIEUX_DEMARCHES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {["", ...CATEGORIES_DEMARCHES].map((c) => (
          <button
            key={c || "tous"}
            onClick={() => setCat(c)}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              cat === c ? "border-gold-500 bg-gold-500 text-ink" : "border-line bg-white text-muted"
            }`}
          >
            {c ? c.split(" (")[0] : "Toutes"}
          </button>
        ))}
      </div>
      <Link href="/demarches/nouvelle" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Partager une démarche
      </Link>
      <Link href="/demandes/nouvelle" className="mb-4 block text-center text-sm font-semibold text-gold-700">
        Une question précise ? La poser aux membres
      </Link>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <FileText size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucune fiche pour le moment. Partagez la première démarche que vous avez faite !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((d) => {
          const i = Math.max(0, CATEGORIES_DEMARCHES.indexOf(d.categorie)) % COULEURS.length;
          return (
            <Link key={d.id} href={`/demarches/${d.id}`} className="card flex overflow-hidden">
              <div className={`w-1.5 flex-none ${COULEURS[i]}`} />
              <div className="min-w-0 flex-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{d.categorie.split(" (")[0]}</p>
                <p className="font-display text-lg font-bold leading-snug">{d.titre}</p>
                {d.resume && <p className="mt-1 line-clamp-2 text-sm text-muted">{d.resume}</p>}
                <p className="mt-2 text-xs text-muted">
                  {[d.lieu, d.delai && `Délai : ${d.delai}`, d.verifieLe && `Vérifié le ${dateFr(d.verifieLe)}`].filter(Boolean).join(" · ")}
                </p>
                {d.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
