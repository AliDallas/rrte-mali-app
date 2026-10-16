"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { Building2, ChevronLeft, MapPin, Plus, Search, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_STRUCTURE, LIBELLE_STRUCTURE, Structure, TypeStructure, structureDepuisDoc } from "@/lib/solidarite";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function StructuresListe({ type }: { type: TypeStructure }) {
  const { user, profile } = useAuth();
  const L = LIBELLE_STRUCTURE[type];
  const [liste, setListe] = useState<Structure[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const Icone = type === "association" ? Building2 : Users;

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Structure[]>("structures");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "structures"))
      .then((r) => {
        const l = r.docs.map((d) => structureDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("structures", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((s) => s.type === type)
      .filter((s) => s.statut !== "en_attente" || profile?.role === "admin" || s.ownerUid === user?.uid)
      .filter((s) => !cat || s.categorie === cat)
      .filter((s) => !n || `${s.nom} ${s.categorie} ${s.description} ${s.ville}`.toLowerCase().includes(n))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  }, [liste, q, cat, type, user, profile]);

  return (
    <AppShell title={L.pluriel} subtitle="Entraide & solidarité">
      <Link href="/solidarite" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Entraide & solidarité
      </Link>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, domaine, ville…"
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
      <Link href={`/solidarite/${L.route}/nouveau`} className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Créer la page de mon {L.un}
      </Link>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Icone size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucun {L.un} pour le moment. Créez la page du vôtre !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((s) => (
          <Link key={s.id} href={`/solidarite/structure/${s.id}`} className="card flex gap-3 p-3">
            {s.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.vignette} alt="" className="h-20 w-20 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Icone size={26} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-bold">{s.nom}</p>
              <p className="text-sm text-muted">{s.categorie}</p>
              {s.ville && (
                <p className="flex items-center gap-1 truncate text-xs text-muted">
                  <MapPin size={12} /> {s.ville}
                </p>
              )}
              {s.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
