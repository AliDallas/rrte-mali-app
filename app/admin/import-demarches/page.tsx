"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { ChevronLeft, Upload } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { viderCache } from "@/lib/cache";
import { DEMARCHES_INITIALES_2 as LOT2 } from "@/lib/demarchesInitiales2";
import { DEMARCHES_INITIALES_3 as LOT3 } from "@/lib/demarchesInitiales3";
import { DEMARCHES_INITIALES_4 as LOT4 } from "@/lib/demarchesInitiales4";
import { DEMARCHES_INITIALES_5 as LOT5 } from "@/lib/demarchesInitiales5";

// Le premier lot (10 fiches d’état civil) est déjà importé et validé : on n’y touche pas.
// Les lots 2, 3 et 4 : seules les fiches absentes de la base sont ajoutées, celles qui existent déjà
// (relues, corrigées ou validées) ne sont jamais écrasées.
const TOUTES = [...LOT2, ...LOT3, ...LOT4, ...LOT5];

export default function ImportDemarchesPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [etat, setEtat] = useState<"attente" | "envoi" | "fini">("attente");
  const [erreur, setErreur] = useState("");
  const [existants, setExistants] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, "demarches"))
      .then((r) => setExistants(new Set(r.docs.map((d) => d.id))))
      .catch(() => setErreur("Impossible de lire les fiches déjà présentes."));
  }, [isAdmin, etat]);

  const nouvelles = useMemo(() => (existants ? TOUTES.filter((d) => !existants.has(d.id)) : []), [existants]);

  async function importer() {
    setEtat("envoi");
    setErreur("");
    try {
      for (let i = 0; i < nouvelles.length; i += 400) {
        const batch = writeBatch(db);
        nouvelles.slice(i, i + 400).forEach(({ id, ...d }) =>
          batch.set(doc(db, "demarches", id), {
            ...d,
            ownerUid: profile?.uid ?? "import-rrte",
            ownerNom: "RRTE",
            statut: "en_attente",
            importLe: serverTimestamp(),
          })
        );
        await batch.commit();
      }
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
            {existants === null ? (
              <p className="text-muted">Vérification des fiches déjà présentes…</p>
            ) : nouvelles.length === 0 ? (
              <p className="font-semibold">Toutes les fiches prêtes sont déjà dans l’application ({TOUTES.length}).</p>
            ) : (
              <>
                <p className="font-semibold">
                  {nouvelles.length} nouvelle{nouvelles.length > 1 ? "s" : ""} fiche{nouvelles.length > 1 ? "s" : ""} à importer
                  {TOUTES.length - nouvelles.length > 0 && ` (${TOUTES.length - nouvelles.length} déjà présente${TOUTES.length - nouvelles.length > 1 ? "s" : ""}, non modifiées)`}
                </p>
                <ul className="max-h-72 list-disc overflow-y-auto pl-5 text-sm text-muted">
                  {nouvelles.map((d) => (
                    <li key={d.id}>{d.titre}</li>
                  ))}
                </ul>
                <p className="pt-2 text-xs text-muted">
                  Elles sont importées « en attente de validation » : relisez chaque fiche dans l’onglet Démarches, corrigez si besoin (bouton modifier), puis validez.
                  Les fiches déjà présentes ne sont jamais écrasées.
                </p>
                <button onClick={importer} disabled={etat === "envoi"} className="btn-gold mt-3 flex items-center justify-center gap-2">
                  <Upload size={16} /> {etat === "envoi" ? "Import…" : `Importer ${nouvelles.length} fiche${nouvelles.length > 1 ? "s" : ""}`}
                </button>
              </>
            )}
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
