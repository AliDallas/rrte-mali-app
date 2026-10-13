"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import DemarcheForm from "@/components/DemarcheForm";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Demarche, demarcheDepuisDoc } from "@/lib/demarches";
import { viderCache } from "@/lib/cache";

export default function ModifierDemarchePage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { profile } = useAuth();
  const [d, setD] = useState<Demarche | null>(null);
  const [etat, setEtat] = useState<"chargement" | "ok" | "absent">("chargement");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "demarches", id))
      .then((s) => {
        if (!s.exists()) return setEtat("absent");
        setD(demarcheDepuisDoc(s.id, s.data()));
        setEtat("ok");
      })
      .catch(() => setEtat("absent"));
  }, [id, profile]);

  return (
    <AppShell title="Modifier la fiche" subtitle="Démarches & papiers">
      {etat === "chargement" && <p className="text-center text-muted">Chargement...</p>}
      {etat === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {etat === "ok" && d && (
        <DemarcheForm
          initial={d}
          envoi={envoi}
          erreur={erreur}
          libelle="Enregistrer les modifications"
          onSubmit={async (f) => {
            setEnvoi(true);
            setErreur("");
            try {
              const { liensPropres, liens: _l, ...reste } = f;
              void _l;
              await updateDoc(doc(db, "demarches", d.id), { ...reste, liens: liensPropres });
              viderCache("demarches");
              router.push(`/demarches/${d.id}`);
            } catch {
              setErreur("Modification refusée : seules les fiches en attente de validation peuvent être modifiées par leur auteur.");
              setEnvoi(false);
            }
          }}
        />
      )}
    </AppShell>
  );
}
