"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { ajouterPhotoGalerie, enregistrerPhotosEvent, MAX_PHOTOS_GALERIE } from "@/lib/events";
import { reduireImage } from "@/lib/image";

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
  const [affiches, setAffiches] = useState<string[]>([]);
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [avance, setAvance] = useState("");
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
        categorie: "rrte",
        statut: "valide",
        created_by: user.uid,
        createdAt: serverTimestamp(),
      });
      if (affiches.length) {
        const vignette = await enregistrerPhotosEvent(ref.id, affiches);
        await updateDoc(ref, { vignette });
      }
      const base = Date.now();
      for (let i = 0; i < fichiers.length; i++) {
        setAvance(`Photos : ${i + 1} / ${fichiers.length}`);
        const data = await reduireImage(fichiers[i], 720, 0.65);
        await ajouterPhotoGalerie(ref.id, data, base + i);
      }
      router.push(`/evenements/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer l’événement. Vérifiez vos droits d’administrateur.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Nouvel événement" subtitle="Événement RRTE, réservé aux administrateurs">
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
          <p className="rounded-xl bg-gold-100 p-3 text-sm text-gold-700">
            Vous pouvez aussi saisir un événement déjà passé (date dans le passé) pour garder la mémoire du groupe, avec son affiche et ses photos.
          </p>
          <div className="card space-y-3 p-4">
            <p className="text-sm font-medium">Affiche (jusqu’à 2)</p>
            <div className="flex flex-wrap gap-2">
              {affiches.map((p, i) => (
                <div key={i} className="relative h-28 w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-28 w-20 rounded-xl object-cover" />
                  <button type="button" aria-label="Retirer" onClick={() => setAffiches(affiches.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-fg">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {affiches.length < 2 && (
                <label className="flex h-28 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                  <ImagePlus size={20} /> Affiche
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) setAffiches([...affiches, await reduireImage(f, 900, 0.7)].slice(0, 2));
                    }}
                  />
                </label>
              )}
            </div>
            <p className="pt-1 text-sm font-medium">Photos de l’événement (jusqu’à {MAX_PHOTOS_GALERIE})</p>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-4 text-sm text-muted">
              <ImagePlus size={18} /> {fichiers.length ? `${fichiers.length} photo${fichiers.length > 1 ? "s" : ""} choisie${fichiers.length > 1 ? "s" : ""} : en ajouter` : "Choisir des photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const nouveaux = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  setFichiers((f) => [...f, ...nouveaux].slice(0, MAX_PHOTOS_GALERIE));
                }}
              />
            </label>
            {fichiers.length > 0 && (
              <button type="button" onClick={() => setFichiers([])} className="text-sm text-muted">
                Retirer toutes les photos
              </button>
            )}
            <p className="text-xs text-muted">Vous pourrez en ajouter d’autres plus tard depuis la fiche de l’événement.</p>
          </div>
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? avance || "Enregistrement..." : "Publier l’événement"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
