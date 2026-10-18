"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { MapPin, Plus, Search, Star, Utensils } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CUISINES, Resto, aujourdhui, moyenneResto, restoDepuisDoc } from "@/lib/restaurants";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function RestaurantsPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Resto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [mes, setMes] = useState(false);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Resto[]>("restos");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "restos"))
      .then((r) => {
        const l = r.docs.map((d) => restoDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("restos", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((r) => r.statut !== "en_attente" || profile?.role === "admin" || r.ownerUid === user?.uid)
      .filter((r) => !mes || r.ownerUid === user?.uid)
      .filter((r) => !cuisine || r.cuisine === cuisine)
      .filter((r) => !n || `${r.nom} ${r.quartier} ${r.cuisine} ${r.platDuJour} ${r.menu.map((p) => p.nom).join(" ")}`.toLowerCase().includes(n))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [liste, q, cuisine, mes, user, profile]);

  return (
    <AppShell title="Restaurants" subtitle="Les tables et menus des membres à Bamako">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, quartier, plat…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="max-w-[42%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Toutes cuisines</option>
          {CUISINES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <Link href="/restaurants/nouveau" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Ajouter mon restaurant
      </Link>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={mes} onChange={(e) => setMes(e.target.checked)} />
        Voir seulement mes restaurants
      </label>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Utensils size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucun restaurant pour le moment. Ajoutez le vôtre !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((r) => (
          <Link key={r.id} href={`/restaurants/${r.id}`} className="card flex gap-3 p-3">
            {r.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.vignette} alt="" className="h-24 w-24 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Utensils size={26} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-bold">{r.nom}</p>
              <p className="text-sm text-muted">{r.cuisine}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <MapPin size={12} /> {r.quartier}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
                <Star size={13} className="fill-gold-500 text-gold-500" />
                {r.nbAvis > 0 ? `${moyenneResto(r).toFixed(1)} · ${r.nbAvis} avis` : "Pas encore noté"}
              </p>
              {r.menuJourDate === aujourdhui() && r.menuJourResume ? (
                <p className="mt-1 truncate text-xs font-semibold text-brand-red">Aujourd’hui : {r.menuJourResume}</p>
              ) : (
                r.platDuJour && <p className="mt-1 truncate text-xs font-semibold text-brand-red">Plat du jour : {r.platDuJour}</p>
              )}
              {r.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
