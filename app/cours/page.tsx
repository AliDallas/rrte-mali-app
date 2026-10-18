"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { GraduationCap, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Cours, MATIERES_COURS, TypeCours, coursDepuisDoc, libelleTypeCours } from "@/lib/cours";

export default function CoursPage() {
  const { user, profile } = useAuth();
  const [liste, setListe] = useState<Cours[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<"" | TypeCours>("");
  const [matiere, setMatiere] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    getDocs(collection(db, "cours"))
      .then((r) => setListe(r.docs.map((d) => coursDepuisDoc(d.id, d.data()))))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return liste
      .filter((c) => c.statut !== "en_attente" || profile?.role === "admin" || c.ownerUid === user?.uid)
      .filter((c) => !type || c.type === type)
      .filter((c) => !matiere || c.matiere === matiere)
      .filter((c) => !n || `${c.titre} ${c.matiere} ${c.lieu} ${c.description} ${c.niveau}`.toLowerCase().includes(n))
      .sort((a, b) => a.titre.localeCompare(b.titre));
  }, [liste, type, matiere, q, profile, user]);

  const chip = (actif: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold ${actif ? "border-gold-500 bg-gold-500/15 text-gold-700" : "border-line text-muted"}`;

  return (
    <AppShell title="Écoles & cours" subtitle="Écoles, centres et cours proposés par les membres">
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3.5 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Arabe, anglais, quartier…"
            className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select value={matiere} onChange={(e) => setMatiere(e.target.value)} className="max-w-[40%] rounded-full border border-line bg-white px-3 text-sm">
          <option value="">Tout</option>
          {MATIERES_COURS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button onClick={() => setType("")} className={chip(type === "")}>Tout</button>
        <button onClick={() => setType("ecole")} className={chip(type === "ecole")}>Écoles</button>
        <button onClick={() => setType("cours")} className={chip(type === "cours")}>Cours</button>
      </div>
      <Link href="/cours/nouveau" className="mb-4 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg">
        <Plus size={16} /> Publier une école ou un cours
      </Link>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <GraduationCap size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">Rien pour le moment. Publiez la première école ou le premier cours !</p>
        </div>
      )}

      <div className="space-y-3">
        {shown.map((c) => (
          <Link key={c.id} href={`/cours/${c.id}`} className="card flex gap-3 p-3">
            {c.vignette ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.vignette} alt="" className="h-20 w-20 flex-none rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <GraduationCap size={24} strokeWidth={1.5} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold">{c.titre}</p>
              <p className="truncate text-sm text-muted">{[libelleTypeCours(c.type), c.matiere, c.lieu].filter(Boolean).join(" · ")}</p>
              {(c.horaires || c.prix) && <p className="mt-1 truncate text-sm">{[c.horaires, c.prix].filter(Boolean).join(" · ")}</p>}
              {c.statut === "en_attente" && <p className="mt-1 text-xs font-semibold text-brand-red">En attente de validation</p>}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
