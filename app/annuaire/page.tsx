"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";

export default function AnnuairePage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    getDocs(query(collection(db, "users"), where("statut", "==", "actif")))
      .then((snap) => {
        const list = snap.docs.map((d) => d.data() as MemberProfile);
        list.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));
        setMembers(list);
      })
      .finally(() => setLoaded(true));
  }, [profile]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members;
    return members.filter((m) => `${m.prenom} ${m.nom}`.toLowerCase().includes(s));
  }, [members, q]);

  return (
    <AppShell title="Membres" subtitle={loaded ? `${members.length} membre${members.length > 1 ? "s" : ""} dans l’application` : "Chargement..."}>
      <label className="card mb-4 flex items-center gap-3 px-4 py-3 text-muted">
        <Search size={18} strokeWidth={1.75} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un nom…"
          className="w-full bg-transparent text-[#202326] outline-none placeholder:text-muted"
        />
      </label>

      {loaded && filtered.length === 0 && (
        <p className="card p-6 text-center text-muted">
          {members.length === 0
            ? "Aucun membre actif pour l’instant. Les 224 fiches arrivent avec l’import de l’annuaire."
            : "Aucun résultat."}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((m) => (
          <div key={m.uid} className="card flex flex-col items-center gap-1 px-3 py-5 text-center">
            <Avatar prenom={m.prenom} nom={m.nom} size={56} />
            <p className="mt-1 text-sm font-semibold">
              {m.prenom} {m.nom}
            </p>
            {m.role === "admin" && (
              <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold text-gold-700">
                Administrateur
              </span>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
