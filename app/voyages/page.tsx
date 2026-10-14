"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { HeartHandshake, Luggage, Plane, Plus, Search, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Voyage, dateFr, expire, libelleType, resumeTarif, voyageDepuisDoc } from "@/lib/voyages";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function VoyagesPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Voyage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [sens, setSens] = useState("");
  const [mesAnnonces, setMesAnnonces] = useState(false);
  const [filtreType, setFiltreType] = useState<"" | "kilos" | "accompagnement">("");

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    const c = lireCache<Voyage[]>("voyages");
    if (c) {
      setListe(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "voyages"))
      .then((r) => {
        const l = r.docs.map((d) => voyageDepuisDoc(d.id, d.data()));
        setListe(l);
        ecrireCache("voyages", l);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((v) => v.statut !== "en_attente" || profile?.role === "admin" || v.ownerUid === user?.uid)
      .filter((v) => (mesAnnonces ? v.ownerUid === user?.uid : !expire(v)))
      .filter((v) => !filtreType || (filtreType === "kilos" ? v.typeAnnonce === "kilos" : v.typeAnnonce !== "kilos"))
      .filter((v) => !sens || (sens === "mali" ? /bamako|mali/i.test(v.arrivee) : /bamako|mali/i.test(v.depart)))
      .filter((v) => !n || `${v.depart} ${v.arrivee} ${v.compagnie} ${v.ownerNom} ${v.message}`.toLowerCase().includes(n))
      .sort((a, b) => a.dateVol.localeCompare(b.dateVol));
  }, [liste, q, sens, mesAnnonces, filtreType, user, profile]);

  return (
    <AppShell title="Voyageurs & bagages" subtitle="Kilos, valises et accompagnement entre membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ville, compagnie, nom…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={sens} onChange={(e) => setSens(e.target.value)} className="max-w-[42%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tous les sens</option>
          <option value="mali">Vers le Mali</option>
          <option value="depuis">Depuis le Mali</option>
        </select>
      </div>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {([
          ["", "Tout"],
          ["kilos", "Kilos & valises"],
          ["accompagnement", "Accompagnement"],
        ] as ["" | "kilos" | "accompagnement", string][]).map(([k, l]) => (
          <button
            key={k || "tout"}
            onClick={() => setFiltreType(k)}
            className={`flex-none rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${filtreType === k ? "border-gold-500 bg-gold-500 text-ink" : "border-line bg-white text-muted"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Link href="/voyages/nouveau" className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Publier une annonce
      </Link>
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={mesAnnonces} onChange={(e) => setMesAnnonces(e.target.checked)} />
        Voir mes annonces (même passées)
      </label>

      <p className="mb-4 rounded-xl bg-gold-100 p-3 text-xs text-gold-700">
        RRTE met les membres en relation mais n’est pas responsable des transports. Vérifiez ce que vous transportez, ne prenez jamais un colis
        fermé dont vous ignorez le contenu.
      </p>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <Luggage size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Aucune annonce pour le moment. Proposez la première !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((v) => (
          <Link key={v.id} href={`/voyages/${v.id}`} className="card block p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 font-display text-lg font-bold">
                <span className="truncate">{v.depart}</span>
                <Plane size={16} className="flex-none text-gold-600" />
                <span className="truncate">{v.arrivee}</span>
              </p>
              {expire(v) && <span className="flex-none rounded-full bg-line px-2 py-0.5 text-xs text-muted">Passée</span>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {v.typeAnnonce === "besoin" ? "Voyage" : "Vol"} le {dateFr(v.dateVol)}{v.dateSouple ? " (dates flexibles)" : ""}
              {v.compagnie && ` · ${v.compagnie}`}
              {v.kilosDispo > 0 && ` · ${v.kilosDispo} kg dispo`}
            </p>
            {v.typeAnnonce === "kilos" ? (
              <>
                <p className="mt-1 text-sm font-semibold">{resumeTarif(v)}</p>
                {v.dateLimite && <p className="mt-1 text-xs text-brand-red">Dépôt des colis avant le {dateFr(v.dateLimite)}</p>}
              </>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#5B3190]">
                {v.typeAnnonce === "besoin" ? <Users size={15} /> : <HeartHandshake size={15} />}
                {libelleType(v.typeAnnonce)} : {v.personne}
                {v.agePersonne && ` (${v.agePersonne})`}
              </p>
            )}
            {v.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
            <p className="mt-2 text-xs font-semibold text-gold-700">{v.ownerNom}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
