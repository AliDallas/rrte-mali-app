"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import RestoForm from "@/components/RestoForm";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Resto, lirePhotosResto, restoDepuisDoc } from "@/lib/restaurants";

export default function ModifierRestoPage() {
  const id = useParams<{ id: string }>()?.id;
  const { user, profile } = useAuth();
  const [resto, setResto] = useState<Resto | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "restos", id))
      .then(async (s) => {
        if (!s.exists()) return setState("absent");
        setResto(restoDepuisDoc(s.id, s.data()));
        setPhotos(await lirePhotosResto(id));
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  const autorise = !!resto && (profile?.role === "admin" || resto.ownerUid === user?.uid);

  return (
    <AppShell title="Modifier mon restaurant" subtitle={resto?.nom ?? "Restaurants"}>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {state === "ok" && resto && !autorise && <p className="card p-6 text-center text-muted">Seul le propriétaire peut modifier cette fiche.</p>}
      {state === "ok" && resto && autorise && <RestoForm resto={resto} photosInitiales={photos} />}
    </AppShell>
  );
}
