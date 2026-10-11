"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import EntrepriseEditeur from "@/components/EntrepriseEditeur";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EntrepriseSaisie, entrepriseDepuisDoc, lirePhotos } from "@/lib/entreprises";

export default function ModifierEntreprisePage() {
  const id = useParams<{ id: string }>()?.id;
  const { profile } = useAuth();
  const [init, setInit] = useState<EntrepriseSaisie | null>(null);
  const [absent, setAbsent] = useState(false);

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "entreprises", id))
      .then(async (s) => {
        if (!s.exists()) return setAbsent(true);
        const e = entrepriseDepuisDoc(s.id, s.data());
        const photos = await lirePhotos(s.id, e.photos);
        setInit({ ...e, photos, liens: e.liens.join("\n") });
      })
      .catch(() => setAbsent(true));
  }, [id, profile]);

  return (
    <AppShell title="Modifier" subtitle="Mettre à jour la fiche">
      {absent && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {!absent && !init && <p className="text-center text-muted">Chargement...</p>}
      {init && <EntrepriseEditeur id={id} initial={init} />}
    </AppShell>
  );
}
