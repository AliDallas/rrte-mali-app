"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ChevronLeft, Search, ShieldCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";

export default function AdministrateursPage() {
  const { user, profile } = useAuth();
  const [membres, setMembres] = useState<MemberProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    getDocs(query(collection(db, "users"), where("statut", "==", "actif")))
      .then((r) => setMembres(r.docs.map((d) => d.data() as MemberProfile)))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [isAdmin]);

  async function changer(m: MemberProfile, role: "admin" | "member") {
    setBusy(m.uid);
    try {
      await updateDoc(doc(db, "users", m.uid), { role });
      setMembres((l) => l.map((x) => (x.uid === m.uid ? { ...x, role } : x)));
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  }

  const liste = useMemo(() => {
    const n = q.trim().toLowerCase();
    return membres
      .filter((m) => !n || `${m.prenom} ${m.nom} ${m.email}`.toLowerCase().includes(n))
      .sort((a, b) => (a.role === b.role ? `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr") : a.role === "admin" ? -1 : 1));
  }, [membres, q]);

  return (
    <AppShell title="Administrateurs" subtitle="Nommer ou retirer un administrateur">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            Un administrateur peut valider les inscriptions, créer des événements, importer l’annuaire et nommer d’autres
            administrateurs. Seuls les membres qui ont un compte validé apparaissent ici.
          </p>
          <label className="card mb-4 flex items-center gap-3 px-4 py-3 text-muted">
            <Search size={18} strokeWidth={1.75} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un membre…"
              className="w-full bg-transparent text-[#202326] outline-none placeholder:text-muted"
            />
          </label>
          {loaded && liste.length === 0 && <p className="card p-6 text-center text-muted">Aucun membre.</p>}
          <div className="space-y-3">
            {liste.map((m) => {
              const moi = m.uid === user?.uid;
              return (
                <div key={m.uid} className="card flex items-center gap-3 p-4">
                  <Avatar prenom={m.prenom} nom={m.nom} size={44} photo={m.photo} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {m.prenom} {m.nom}
                    </p>
                    <p className="truncate text-sm text-muted">{m.email}</p>
                    {m.role === "admin" && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold text-gold-700">
                        <ShieldCheck size={12} /> Administrateur
                      </span>
                    )}
                  </div>
                  {moi ? (
                    <span className="text-xs text-muted">Vous</span>
                  ) : confirm === m.uid ? (
                    <div className="flex gap-2">
                      <button
                        disabled={busy === m.uid}
                        onClick={() => changer(m, m.role === "admin" ? "member" : "admin")}
                        className="rounded-full bg-gold-500 px-3 py-1.5 text-sm font-semibold text-ink disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                      <button onClick={() => setConfirm(null)} className="rounded-full border border-line px-3 py-1.5 text-sm">
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirm(m.uid)}
                      className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold"
                    >
                      {m.role === "admin" ? "Retirer" : "Nommer admin"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AppShell>
  );
}
