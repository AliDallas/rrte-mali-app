"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { ChevronLeft, Upload } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { viderCache } from "@/lib/cache";
import { DEMARCHES_INITIALES } from "@/lib/demarchesInitiales";

export default function ImportDemarchesPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [etat, setEtat] = useState<"attente" | "envoi" | "fini">("attente");
  const [erreur, setErreur] = useState("");

  async function importer() {
    setEtat("envoi");
    setErreur("");
    try {
      const batch = writeBatch(db);
      DEMARCHES_INITIALES.forEach(({ id, ...d }) =>
        batch.set(
          doc(db, "demarches", id),
          { ...d, ownerUid: profile?.uid ?? "import-rrte", ownerNom: "RRTE", statut: "en_attente", importLe: serverTimestamp() },
          { merge: true }
        )
      );
      await batch.commit();
      viderCache("demarches");
      setEtat("fini");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur pendant l’import.");
      setEtat("attente");
    }
  }

  return (
    <AppShell title="Administration" subtitle="Importer les fiches de démarches">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-2 p-5">
            <p className="font-semibold">{DEMARCHES_INITIALES.length} fiches « état civil » prêtes</p>
            <ul className="list-disc pl-5 text-sm text-muted">
              {DEMARCHES_INITIALES.map((d) => (
                <li key={d.id}>{d.titre}</li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted">
              Elles sont importées « en attente de validation » : relisez chaque fiche dans l’onglet Démarches, corrigez si besoin (bouton modifier), puis validez.
              Relancer l’import écrase vos modifications sur ces mêmes fiches.
            </p>
            <button onClick={importer} disabled={etat === "envoi"} className="btn-gold mt-3 flex items-center justify-center gap-2">
              <Upload size={16} /> {etat === "envoi" ? "Import…" : "Importer les fiches"}
            </button>
          </div>
          {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
          {etat === "fini" && (
            <div className="rounded-xl bg-[#E3F0DC] p-4 text-sm text-[#3C7026]">
              Import terminé. Ouvrez l’onglet Démarches pour relire et valider les fiches.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
