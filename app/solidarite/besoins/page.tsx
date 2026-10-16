"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { AlertTriangle, CalendarClock, ChevronLeft, Megaphone, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Besoin, TYPES_BESOIN, besoinDepuisDoc, dateFr, joursRestants, libelleDelai } from "@/lib/solidarite";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function BesoinsPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Besoin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [passes, setPasses] = useState(false);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Besoin[]>("besoins");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "besoins"))
      .then((r) => {
        const l = r.docs.map((d) => besoinDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("besoins", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const actif = (b: Besoin) => !b.resolu && (joursRestants(b.dateLimite) ?? 0) >= 0;
    return liste
      .filter((b) => b.statut !== "en_attente" || profile?.role === "admin" || b.ownerUid === user?.uid)
      .filter((b) => passes || actif(b))
      .filter((b) => !type || b.type === type)
      .filter((b) => !n || `${b.titre} ${b.texte} ${b.lieu} ${b.ownerNom}`.toLowerCase().includes(n))
      .sort((a, b) => {
        const aa = actif(a) ? 0 : 1;
        const bb = actif(b) ? 0 : 1;
        if (aa !== bb) return aa - bb;
        if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
        return (a.dateLimite || "9999").localeCompare(b.dateLimite || "9999");
      });
  }, [liste, q, type, passes, user, profile]);

  return (
    <AppShell title="Besoins & urgences" subtitle="Appels à l’aide avec date limite">
      <Link href="/solidarite" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Entraide & solidarité
      </Link>
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titre, lieu, personne…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="max-w-[42%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tous types</option>
          {TYPES_BESOIN.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <Link href="/solidarite/besoins/nouveau" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-brand-red px-4 py-3 text-sm font-semibold text-white">
        <Plus size={16} /> Publier un besoin ou une urgence
      </Link>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={passes} onChange={(e) => setPasses(e.target.checked)} />
        Voir aussi les besoins terminés ou expirés
      </label>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Megaphone size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucun besoin en cours.</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((b) => {
          const j = joursRestants(b.dateLimite);
          const fini = b.resolu || (j !== null && j < 0);
          return (
            <Link key={b.id} href={`/solidarite/besoins/${b.id}`} className={`card block space-y-1 p-4 ${b.urgent && !fini ? "border-2 border-brand-red" : ""} ${fini ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                {b.urgent && !fini && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-xs font-bold text-white">
                    <AlertTriangle size={11} /> URGENT
                  </span>
                )}
                <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">{b.type}</span>
              </div>
              <p className="font-display font-bold">{b.titre}</p>
              <p className="flex items-center gap-1 text-xs font-semibold">
                <CalendarClock size={13} className={fini ? "text-muted" : "text-brand-red"} />
                {b.resolu ? "Terminé" : libelleDelai(b.dateLimite)} · {dateFr(b.dateLimite)}
              </p>
              <p className="line-clamp-2 text-sm text-muted">{b.texte}</p>
              <p className="text-xs text-muted">par {b.ownerNom}</p>
              {b.statut === "en_attente" && <p className="text-xs font-semibold text-brand-red">En attente de validation</p>}
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
