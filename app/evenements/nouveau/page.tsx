"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const input =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function NouvelEvenementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "events"), {
        titre: titre.trim(),
        date,
        heure,
        lieu: lieu.trim(),
        description: description.trim(),
        attendees: [],
        created_by: user.uid,
        createdAt: serverTimestamp(),
      });
      router.push(`/evenements/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer l’événement. Vérifiez vos droits d’administrateur.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Nouvel événement" subtitle="Réservé aux administrateurs">
      {profile?.role !== "admin" ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <label className="block text-sm font-medium">
            Titre
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={`${input} mt-1.5`} placeholder="Barbecue RRTE" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Date
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium">
              Heure
              <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={`${input} mt-1.5`} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Lieu
            <input value={lieu} onChange={(e) => setLieu(e.target.value)} className={`${input} mt-1.5`} placeholder="Bamako" />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className={`${input} mt-1.5`} />
          </label>
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Enregistrement..." : "Publier l’événement"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
