"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Briefcase, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES, Entreprise, entrepriseDepuisDoc } from "@/lib/entreprises";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function EntreprisesPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Entreprise[]>([]);
  const [mes, setMes] = useState<Entreprise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"toutes" | "mes">("toutes");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user || profile?.statut !== "actif") return;
    const c = lireCache<[Entreprise[], Entreprise[]]>(`entreprises-${user.uid}`);
    if (c) {
      setListe(c[0]);
      setMes(c[1]);
      setLoaded(true);
      return;
    }
    Promise.all([
      getDocs(query(collection(db, "entreprises"), where("statut", "==", "publie"))),
      getDocs(query(collection(db, "entreprises"), where("ownerUid", "==", user.uid))),
    ])
      .then(([a, b]) => {
        const l = a.docs.map((d) => entrepriseDepuisDoc(d.id, d.data()));
        const m = b.docs.map((d) => entrepriseDepuisDoc(d.id, d.data()));
        setListe(l);
        setMes(m);
        ecrireCache(`entreprises-${user.uid}`, [l, m]);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [user, profile]);

  const shown = useMemo(() => {
    const base = tab === "mes" ? mes : liste;
    const n = q.trim().toLowerCase();
    return base
      .filter((e) => !cat || e.categorie === cat)
      .filter((e) => !n || `${e.nom} ${e.description} ${e.quartier} ${e.categorie}`.toLowerCase().includes(n))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [tab, liste, mes, cat, q]);

  const tabs = [
    { key: "toutes", label: "Toutes" },
    { key: "mes", label: "Mes entreprises" },
  ] as const;

  return (
    <AppShell title="Entreprises" subtitle="Les entreprises des membres">
      <div className="mb-3 flex items-center gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-none rounded-full border px-4 py-1.5 text-sm ${
              tab === t.key ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/entreprises/nouvelle"
          className="ml-auto flex flex-none items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-ink-fg"
        >
          <Plus size={16} /> Ajouter
        </Link>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une entreprise, un quartier…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="max-w-[40%] rounded-full border border-line bg-white px-3 text-sm"
        >
          <option value="">Toutes</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Briefcase size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">
            {tab === "mes" ? "Vous n’avez encore rien ajouté." : "Aucune entreprise pour le moment. Ajoutez la première !"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((e) => (
          <Link key={e.id} href={`/entreprises/${e.id}`} className="card flex items-center gap-4 p-4">
            {e.logo || e.vignette || e.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.logo || e.vignette || e.photos[0]} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Briefcase size={24} strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold">{e.nom}</p>
              <p className="truncate text-sm text-muted">
                {[e.categorie, e.quartier].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {e.statut === "en_attente" && (
                  <span className="rounded-full bg-brand-red/10 px-2.5 py-0.5 text-xs font-semibold text-brand-red">
                    En attente de validation
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
