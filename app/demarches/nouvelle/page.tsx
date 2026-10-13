"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import DemarcheForm, { saisieDemarcheVide } from "@/components/DemarcheForm";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { viderCache } from "@/lib/cache";

export default function NouvelleDemarchePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const admin = profile?.role === "admin";

  return (
    <AppShell title="Partager une démarche" subtitle="Ce que vous avez appris pour vous aider entre membres">
      <DemarcheForm
        initial={saisieDemarcheVide()}
        envoi={envoi}
        erreur={erreur}
        libelle={admin ? "Publier la fiche" : "Envoyer pour validation"}
        onSubmit={async (d) => {
          if (!user || !profile) return;
          setEnvoi(true);
          setErreur("");
          try {
            const { liensPropres, liens: _l, ...reste } = d;
            void _l;
            const ref = await addDoc(collection(db, "demarches"), {
              ...reste,
              liens: liensPropres,
              ownerUid: user.uid,
              ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
              statut: admin ? "valide" : "en_attente",
              createdAt: serverTimestamp(),
            });
            viderCache("demarches");
            router.push(`/demarches/${ref.id}`);
          } catch {
            setErreur("Impossible d’enregistrer. Réessayez dans un instant.");
            setEnvoi(false);
          }
        }}
      />
      {!admin && <p className="mt-3 text-sm text-muted">Votre fiche sera publiée après relecture par un administrateur.</p>}
    </AppShell>
  );
}
