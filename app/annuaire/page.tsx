"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, ficheDepuisDoc, nomComplet } from "@/lib/fiches";
import { ecrireCache, lireCache } from "@/lib/cache";

export default function AnnuairePage() {
  const { profile } = useAuth();
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    const c = lireCache<Fiche[]>("annuaire");
    if (c) {
      setFiches(c);
      setLoaded(true);
      return;
    }
    getDocs(collection(db, "fiches"))
      .then((snap) => {
        const list = snap.docs.map((d) => ficheDepuisDoc(d.id, d.data()));
        list.sort((a, b) => `${a.nom} ${a.prenom}`.trim().localeCompare(`${b.nom} ${b.prenom}`.trim(), "fr"));
        setFiches(list);
        ecrireCache("annuaire", list);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return fiches;
    return fiches.filter((f) =>
      `${f.prenom} ${f.nom} ${f.activite} ${f.competences} ${f.ville}`.toLowerCase().includes(s)
    );
  }, [fiches, q]);

  return (
    <AppShell
      title="Membres"
      subtitle={loaded ? `${fiches.length} membre${fiches.length > 1 ? "s" : ""} dans l’annuaire` : "Chargement..."}
    >
      <label className="card mb-4 flex items-center gap-3 px-4 py-3 text-muted">
        <Search size={18} strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, métier, ville…"
          className="w-full bg-transparent text-[#202326] outline-none placeholder:text-muted"
        />
      </label>

      {loaded && filtered.length === 0 && (
        <p className="card p-6 text-center text-muted">
          {fiches.length === 0 ? "L’annuaire est vide pour l’instant." : "Aucun résultat."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((f) => (
          <Link key={f.id} href={`/annuaire/${f.id}`} className="card flex flex-col items-center gap-1 px-3 py-5 text-center">
            <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={56} photo={f.photo} />
            <p className="mt-1 text-sm font-semibold">{nomComplet(f)}</p>
            {f.activite && <p className="line-clamp-2 text-xs text-muted">{f.activite}</p>}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
