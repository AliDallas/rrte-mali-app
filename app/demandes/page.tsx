"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { MessageSquare, Plus, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Demande, demandeDepuisDoc, ilYa } from "@/lib/demandes";
import { METIERS } from "@/lib/prestataires";

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export default function DemandesPage() {
  const { profile, user } = useAuth();
  const [liste, setListe] = useState<Demande[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [onglet, setOnglet] = useState<"toutes" | "miennes">("toutes");
  const [type, setType] = useState<"" | "cherche" | "propose">("");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    getDocs(query(collection(db, "demandes"), orderBy("createdAt", "desc"), limit(100)))
      .then((r) => setListe(r.docs.map((d) => demandeDepuisDoc(d.id, d.data()))))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile]);

  const filtrees = useMemo(() => {
    const s = norm(q);
    return liste.filter((d) => {
      if (onglet === "miennes" && d.auteurUid !== user?.uid) return false;
      if (type && d.type !== type) return false;
      if (cat && d.categorie !== cat) return false;
      return !s || norm(`${d.titre} ${d.details} ${d.categorie}`).includes(s);
    });
  }, [liste, onglet, type, cat, q, user]);

  const chip = (on: boolean) =>
    `max-w-full rounded-full border px-3.5 py-1.5 text-sm ${on ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`;

  return (
    <AppShell title="Demandes" subtitle="Je cherche · Je propose">
      <Link href="/demandes/nouvelle" className="btn-gold mb-4 flex items-center justify-center gap-2">
        <Plus size={18} /> Publier une demande ou une offre
      </Link>

      <div className="mb-3 flex gap-2">
        <button onClick={() => setOnglet("toutes")} className={chip(onglet === "toutes")}>Toutes</button>
        <button onClick={() => setOnglet("miennes")} className={chip(onglet === "miennes")}>Mes demandes</button>
      </div>

      <label className="card mb-3 flex items-center gap-3 px-4 py-3 text-muted">
        <Search size={18} strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Plombier, local, comptable…"
          className="w-full bg-transparent text-[#202326] outline-none placeholder:text-muted"
        />
      </label>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setType(type === "cherche" ? "" : "cherche")} className={chip(type === "cherche")}>Je cherche</button>
        <button onClick={() => setType(type === "propose" ? "" : "propose")} className={chip(type === "propose")}>Je propose</button>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={chip(!!cat)}>
          <option value="">Métier</option>
          {METIERS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loaded && filtrees.length === 0 && (
        <p className="card p-6 text-center text-muted">
          {liste.length === 0 ? "Aucune demande pour l’instant. Soyez le premier à en publier une." : "Aucun résultat."}
        </p>
      )}

      <div className="space-y-3">
        {filtrees.map((d) => (
          <Link key={d.id} href={`/demandes/${d.id}`} className={`card flex gap-3 p-4 ${d.statut === "resolue" ? "opacity-60" : ""}`}>
            <Avatar prenom={d.auteurNom.split(" ")[0]} nom={d.auteurNom.split(" ").slice(1).join(" ")} size={44} photo={d.auteurPhoto} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${d.type === "cherche" ? "bg-brand-red/10 text-brand-red" : "bg-emerald-100 text-emerald-700"}`}>
                  {d.type === "cherche" ? "Je cherche" : "Je propose"}
                </span>
                {d.categorie && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700">{d.categorie}</span>}
                {d.statut === "resolue" && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-muted">Résolue</span>}
              </div>
              <p className="mt-1 font-semibold">{d.titre}</p>
              {d.details && <p className="line-clamp-2 text-sm text-muted">{d.details}</p>}
              <p className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                <span>{d.auteurNom} · {ilYa(d.createdAt)}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12} /> {d.nbReponses}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
