"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import StructureForm from "@/components/StructureForm";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Structure, lirePhotosStructure, structureDepuisDoc } from "@/lib/solidarite";

export default function ModifierStructurePage() {
  const id = useParams<{ id: string }>()?.id;
  const { user, profile } = useAuth();
  const [s, setS] = useState<Structure | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "structures", id))
      .then(async (d) => {
        if (!d.exists()) return setState("absent");
        setS(structureDepuisDoc(d.id, d.data()));
        setPhotos(await lirePhotosStructure(id));
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  const autorise = !!s && (profile?.role === "admin" || s.ownerUid === user?.uid);

  return (
    <AppShell title="Modifier ma page" subtitle={s?.nom ?? "Entraide & solidarité"}>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Page introuvable.</p>}
      {state === "ok" && s && !autorise && <p className="card p-6 text-center text-muted">Seul l’administrateur de cette page peut la modifier.</p>}
      {state === "ok" && s && autorise && <StructureForm type={s.type} structure={s} photosInitiales={photos} />}
    </AppShell>
  );
}
