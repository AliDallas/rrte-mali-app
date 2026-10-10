"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Check, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";

export default function AdminPage() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<MemberProfile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "users"), where("statut", "==", "en_attente")));
    setPending(snap.docs.map((d) => d.data() as MemberProfile));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isAdmin) load().catch(() => setLoaded(true));
  }, [isAdmin, load]);

  async function decide(uid: string, statut: "actif" | "refuse") {
    setBusy(uid);
    try {
      await updateDoc(doc(db, "users", uid), { statut });
      setPending((p) => p.filter((m) => m.uid !== uid));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Administration" subtitle="Valider les inscriptions">
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : !loaded ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : pending.length === 0 ? (
        <p className="card p-6 text-center text-muted">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((m) => (
            <div key={m.uid} className="card flex items-center gap-3 p-4">
              <Avatar prenom={m.prenom} nom={m.nom} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {m.prenom} {m.nom}
                </p>
                <p className="truncate text-sm text-muted">{m.email}</p>
              </div>
              <button
                disabled={busy === m.uid}
                onClick={() => decide(m.uid, "refuse")}
                aria-label="Refuser"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
              >
                <X size={18} />
              </button>
              <button
                disabled={busy === m.uid}
                onClick={() => decide(m.uid, "actif")}
                aria-label="Approuver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
              >
                <Check size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
