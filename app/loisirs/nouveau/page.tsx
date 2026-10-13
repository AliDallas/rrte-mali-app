"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_LOISIRS, enregistrerPhotosLoisir } from "@/lib/loisirs";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
const MAX_PHOTOS = 3;
const MAX_LIENS = 4;

export default function NouveauLoisirPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [categorie, setCategorie] = useState("");
  const [adresse, setAdresse] = useState("");
  const [description, setDescription] = useState("");
  const [liens, setLiens] = useState<string[]>([""]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    try {
      const nouvelles = await Promise.all(files.map((f) => reduireImage(f, 800, 0.7)));
      setPhotos((p) => [...p, ...nouvelles].slice(0, MAX_PHOTOS));
    } catch {
      setError("Une photo n’a pas pu être lue.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const propres = liens.map(nettoyerLien).filter(Boolean);
    if (liens.some((l) => l.trim()) && propres.length !== liens.filter((l) => l.trim()).length) {
      return setError("Un des liens n’est pas valide.");
    }
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "loisirs"), {
        titre: titre.trim(),
        categorie,
        adresse: adresse.trim(),
        description: description.trim(),
        liens: propres,
        vignette: "",
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        createdAt: serverTimestamp(),
      });
      if (photos.length) {
        const vignette = await enregistrerPhotosLoisir(ref.id, photos);
        await updateDoc(ref, { vignette });
      }
      viderCache("loisirs");
      router.push(`/loisirs/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Partager" subtitle="Une adresse, une sortie, une idée de loisir">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Nom du lieu ou de l’activité
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Catégorie
            <select required value={categorie} onChange={(e) => setCategorie(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {CATEGORIES_LOISIRS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Adresse ou quartier
            <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Ex. ACI 2000, route de Koulikoro" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pourquoi y aller, prix, horaires, contact…"
              className={input}
            />
          </label>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Photos (jusqu’à {MAX_PHOTOS})</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <button
                  type="button"
                  aria-label="Retirer la photo"
                  onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-fg"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                <ImagePlus size={20} />
                Ajouter
                <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
              </label>
            )}
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Liens TikTok, YouTube, Google Maps, Facebook…</p>
          {liens.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={l}
                onChange={(e) => setLiens(liens.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Collez le lien ici"
                inputMode="url"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {liens.length > 1 && (
                <button type="button" aria-label="Retirer le lien" onClick={() => setLiens(liens.filter((_, j) => j !== i))} className="px-1 text-muted">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          {liens.length < MAX_LIENS && (
            <button type="button" onClick={() => setLiens([...liens, ""])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
              <Plus size={15} /> Ajouter un lien
            </button>
          )}
        </div>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Publication..." : "Publier"}
        </button>
      </form>
    </AppShell>
  );
}
