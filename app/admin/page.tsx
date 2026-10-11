"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Check, FileSpreadsheet, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";
import { cle, nomComplet, ficheDepuisDoc, Fiche } from "@/lib/fiches";

export default function AdminPage() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<MemberProfile[]>([]);
  const [liens, setLiens] = useState<Record<string, Fiche>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "users"), where("statut", "==", "en_attente")));
    const list = snap.docs.map((d) => d.data() as MemberProfile);
    setPending(list);
    // rapprochement automatique avec l'annuaire importé, par numéro de téléphone
    const trouves: Record<string, Fiche> = {};
    for (const m of list) {
      const k = m.telephone ? cle(m.telephone) : "";
      if (k.length < 8) continue;
      const r = await getDocs(query(collection(db, "fiches"), where("cles", "array-contains", k)));
      if (!r.empty) trouves[m.uid] = ficheDepuisDoc(r.docs[0].id, r.docs[0].data());
    }
    setLiens(trouves);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isAdmin) load().catch(() => setLoaded(true));
  }, [isAdmin, load]);

  async function decide(uid: string, statut: "actif" | "refuse") {
    setBusy(uid);
    try {
      await updateDoc(doc(db, "users", uid), { statut });
      if (statut === "actif" && liens[uid]) {
        await updateDoc(doc(db, "fiches", liens[uid].id), { uid });
      }
      setPending((p) => p.filter((m) => m.uid !== uid));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Administration" subtitle="Valider les inscriptions">
      {isAdmin && (
        <Link href="/admin/import" className="card mb-4 flex items-center gap-3 p-4">
          <FileSpreadsheet className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Importer l’annuaire</p>
            <p className="text-xs text-muted">Charger le fichier des membres (CSV)</p>
          </div>
        </Link>
      )}
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
                {m.telephone && <p className="truncate text-sm text-muted">{m.telephone}</p>}
                {liens[m.uid] ? (
                  <p className="mt-1 text-xs font-semibold text-[#3C7026]">
                    Fiche trouvée : {nomComplet(liens[m.uid])}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-brand-red">Aucune fiche avec ce numéro</p>
                )}
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
