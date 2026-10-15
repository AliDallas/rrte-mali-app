"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { Building2, MapPin, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { BIENS, Immo, TYPES_IMMO, TypeAnnonceImmo, immoDepuisDoc, libelleTermine, libelleTypeImmo, resumePrix } from "@/lib/immobilier";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function ImmobilierPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Immo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | TypeAnnonceImmo>("");
  const [bien, setBien] = useState("");
  const [mes, setMes] = useState(false);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Immo[]>("immobilier");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "immobilier"))
      .then((r) => {
        const l = r.docs.map((d) => immoDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("immobilier", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((i) => i.statut !== "en_attente" || profile?.role === "admin" || i.ownerUid === user?.uid)
      .filter((i) => (mes ? i.ownerUid === user?.uid : !i.termine))
      .filter((i) => !type || i.typeAnnonce === type)
      .filter((i) => !bien || i.bien === bien)
      .filter((i) => !n || `${i.titre} ${i.quartier} ${i.ville} ${i.description} ${i.ownerNom}`.toLowerCase().includes(n));
  }, [liste, q, type, bien, mes, user, profile]);

  return (
    <AppShell title="Immobilier" subtitle="Locations, courts séjours, ventes et terrains entre membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Quartier, mot-clé…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={bien} onChange={(e) => setBien(e.target.value)} className="max-w-[42%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tous les biens</option>
          {BIENS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {([["", "Tout"], ...TYPES_IMMO.map((t) => [t.key, t.court])] as ["" | TypeAnnonceImmo, string][]).map(([k, l]) => (
          <button
            key={k || "tout"}
            onClick={() => setType(k)}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${type === k ? "border-gold-500 bg-gold-500 text-ink" : "border-line bg-white text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Link href="/immobilier/nouveau" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Publier une annonce
      </Link>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={mes} onChange={(e) => setMes(e.target.checked)} />
        Voir mes annonces (même terminées)
      </label>

      <p className="mb-4 rounded-xl bg-gold-100 p-3 text-xs text-gold-700">
        Les annonces sont publiées après validation par un administrateur. RRTE met les membres en relation mais n’est pas partie aux transactions : visitez,
        vérifiez les papiers et ne payez rien avant.
      </p>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Building2 size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucune annonce pour le moment. Publiez la première !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((i) => (
          <Link key={i.id} href={`/immobilier/${i.id}`} className="card flex gap-3 p-3">
            {i.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.vignette} alt="" className="h-24 w-24 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-24 w-24 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <Building2 size={26} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[#1B7F76]/10 px-2 py-0.5 text-xs font-semibold text-[#1B7F76]">{libelleTypeImmo(i.typeAnnonce)}</span>
                {i.meuble && i.typeAnnonce !== "vente" && (
                  <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">{i.meuble === "meuble" ? "Meublé" : "Non meublé"}</span>
                )}
                {i.termine && <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">{libelleTermine(i.typeAnnonce)}</span>}
              </div>
              <p className="mt-1 truncate font-display font-bold">{i.titre}</p>
              <p className="text-sm font-semibold">{resumePrix(i)}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted">
                <MapPin size={12} /> {[i.quartier, i.ville].filter(Boolean).join(", ")}
                {i.surface > 0 && ` · ${i.surface} m²`}
                {i.pieces > 0 && ` · ${i.pieces} p.`}
              </p>
              {i.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
