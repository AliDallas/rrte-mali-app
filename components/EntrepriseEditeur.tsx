"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import EntrepriseForm from "./EntrepriseForm";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EntrepriseSaisie, saisieVersDoc } from "@/lib/entreprises";

export default function EntrepriseEditeur({ id, initial }: { id?: string; initial: EntrepriseSaisie }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [f, setF] = useState<EntrepriseSaisie>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isAdmin = profile?.role === "admin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setError("");
    try {
      const data = saisieVersDoc(f);
      if (JSON.stringify(data).length > 850000) throw new Error("taille");
      if (!id && !isAdmin) {
        const mine = await getDocs(query(collection(db, "entreprises"), where("ownerUid", "==", user.uid)));
        if (mine.size >= 5) throw new Error("max");
      }
      if (id) {
        await updateDoc(doc(db, "entreprises", id), { ...data, updatedAt: serverTimestamp() });
        router.push(`/entreprises/${id}`);
      } else {
        const ref = await addDoc(collection(db, "entreprises"), {
          ...data,
          ownerUid: user.uid,
          ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
          statut: "publie",
          createdAt: serverTimestamp(),
        });
        router.push(`/entreprises/${ref.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "max"
          ? "Vous avez déjà 5 entreprises, le maximum autorisé."
          : err instanceof Error && err.message === "taille"
          ? "Les photos sont trop lourdes : retirez-en une ou deux."
          : "Impossible d’enregistrer. Réessayez dans un instant."
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="card p-5">
        <EntrepriseForm value={f} onChange={setF} />
      </div>
      {!id && <p className="text-sm text-muted">Jusqu’à 5 entreprises par membre, reliées à votre contact.</p>}
      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Enregistrement..." : id ? "Enregistrer" : "Envoyer"}
      </button>
    </form>
  );
}
