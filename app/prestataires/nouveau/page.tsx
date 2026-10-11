"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { METIERS } from "@/lib/prestataires";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function NouveauPrestatairePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [metier, setMetier] = useState("");
  const [tel, setTel] = useState("");
  const [quartier, setQuartier] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "prestataires"), {
        nom: nom.trim(),
        metier,
        tel: tel.trim(),
        quartier: quartier.trim(),
        description: description.trim(),
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        nbAvis: 0,
        sommeNotes: 0,
        createdAt: serverTimestamp(),
      });
      viderCache("prestataires");
      router.push(`/prestataires/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Recommander" subtitle="Un contact que vous conseillez aux membres">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Nom de la personne ou de l’enseigne
            <input required value={nom} onChange={(e) => setNom(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Métier
            <select required value={metier} onChange={(e) => setMetier(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {METIERS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Téléphone / WhatsApp
              <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium">
              Quartier
              <input value={quartier} onChange={(e) => setQuartier(e.target.value)} className={input} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Pourquoi le recommandez-vous ?
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
          </label>
        </div>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Enregistrement..." : "Publier la recommandation"}
        </button>
      </form>
    </AppShell>
  );
}
