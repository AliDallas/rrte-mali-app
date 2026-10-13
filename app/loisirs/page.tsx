"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { PartyPopper, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_LOISIRS, Loisir, loisirDepuisDoc } from "@/lib/loisirs";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function LoisirsPage() {
  const { profile } = useAuth();
  const [liste, setListe] = useState<Loisir[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Loisir[]>("loisirs");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "loisirs"))
      .then((r) => {
        const l = r.docs.map((d) => loisirDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("loisirs", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((l) => !cat || l.categorie === cat)
      .filter((l) => !n || `${l.titre} ${l.categorie} ${l.adresse} ${l.description}`.toLowerCase().includes(n))
      .sort((a, b) => a.titre.localeCompare(b.titre));
  }, [liste, cat, q]);

  return (
    <AppShell title="Loisirs" subtitle="Les bonnes adresses et sorties partagées par les membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Plage, hôtel, quartier…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="max-w-[40%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tous</option>
          {CATEGORIES_LOISIRS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <Link href="/loisirs/nouveau" className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Partager une adresse ou une sortie
      </Link>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <PartyPopper size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Rien pour le moment. Partagez la première bonne adresse !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((l) => (
          <Link key={l.id} href={`/loisirs/${l.id}`} className="card flex gap-3 p-3">
            {l.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.vignette} alt="" className="h-20 w-20 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <PartyPopper size={24} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold">{l.titre}</p>
              <p className="truncate text-sm text-muted">{[l.categorie, l.adresse].filter(Boolean).join(" · ")}</p>
              {l.description && <p className="mt-1 line-clamp-2 text-sm">{l.description}</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
