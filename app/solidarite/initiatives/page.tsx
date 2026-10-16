"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { CalendarDays, ChevronLeft, Lightbulb, MapPin, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_STRUCTURE, Initiative, dateFr, initiativeDepuisDoc } from "@/lib/solidarite";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function InitiativesPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Initiative[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [mes, setMes] = useState(false);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Initiative[]>("initiatives");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "initiatives"))
      .then((r) => {
        const l = r.docs.map((d) => initiativeDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("initiatives", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((i) => i.statut !== "en_attente" || profile?.role === "admin" || i.ownerUid === user?.uid)
      .filter((i) => !mes || i.ownerUid === user?.uid)
      .filter((i) => !cat || i.categorie === cat)
      .filter((i) => !n || `${i.titre} ${i.texte} ${i.lieu} ${i.ownerNom}`.toLowerCase().includes(n))
      .sort((a, b) => b.creeLe - a.creeLe);
  }, [liste, q, cat, mes, user, profile]);

  return (
    <AppShell title="Initiatives" subtitle="Les actions et projets des membres">
      <Link href="/solidarite" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Entraide & solidarité
      </Link>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titre, lieu, membre…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="max-w-[42%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tous domaines</option>
          {CATEGORIES_STRUCTURE.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <Link href="/solidarite/initiatives/nouveau" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Proposer une initiative
      </Link>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={mes} onChange={(e) => setMes(e.target.checked)} />
        Voir seulement mes initiatives
      </label>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Lightbulb size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucune initiative pour le moment. Proposez la vôtre !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((i) => (
          <Link key={i.id} href={`/solidarite/initiatives/${i.id}`} className="card block space-y-1 p-4">
            <p className="font-display font-bold">{i.titre}</p>
            <p className="text-xs text-muted">
              {i.categorie} · par {i.ownerNom}
            </p>
            {(i.date || i.lieu) && (
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted">
                {i.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} /> {dateFr(i.date)}
                  </span>
                )}
                {i.lieu && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {i.lieu}
                  </span>
                )}
              </p>
            )}
            <p className="line-clamp-2 text-sm text-muted">{i.texte}</p>
            {i.statut === "en_attente" && <p className="text-xs font-semibold text-brand-red">En attente de validation</p>}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
