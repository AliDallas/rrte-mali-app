"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, ImagePlus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import LiensEditeur from "@/components/LiensEditeur";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { MAX_LIENS_FIL, MAX_PHOTOS_FIL, MAX_TEXTE_FIL, enregistrerPhotosFil } from "@/lib/fil";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

export default function NouvellePublicationPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [liens, setLiens] = useState<string[]>([""]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_FIL - photos.length);
    e.target.value = "";
    try {
      const nouvelles = await Promise.all(files.map((f) => reduireImage(f, 900, 0.7)));
      setPhotos((p) => [...p, ...nouvelles].slice(0, MAX_PHOTOS_FIL));
    } catch {
      setError("Une photo n’a pas pu être lue.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const remplis = liens.filter((l) => l.trim());
    const propres = remplis.map(nettoyerLien).filter(Boolean);
    if (propres.length !== remplis.length) return setError("Un des liens n’est pas valide.");
    if (!texte.trim() && photos.length === 0 && propres.length === 0) return setError("Écrivez un texte, ou ajoutez une photo ou un lien.");
    if (photos.join("").length > 900000) return setError("Les photos sont trop lourdes ensemble : retirez-en une.");
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "fil"), {
        texte: texte.trim(),
        liens: propres,
        nbPhotos: photos.length,
        aimes: [],
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        statut: profile.role === "admin" ? "valide" : "en_attente",
        creeLe: serverTimestamp(),
      });
      if (photos.length) await enregistrerPhotosFil(ref.id, photos);
      viderCache("fil");
      router.push("/fil");
    } catch {
      setError("Impossible de publier. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Publier" subtitle="Partagez une nouvelle avec le groupe">
      <Link href="/fil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Fil d’actualité
      </Link>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-2 p-5">
          <textarea
            rows={6}
            maxLength={MAX_TEXTE_FIL}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Une nouvelle, une réussite, une information utile au groupe…"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          <p className="text-right text-xs text-muted">{texte.length}/{MAX_TEXTE_FIL}</p>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Photos (jusqu’à {MAX_PHOTOS_FIL})</p>
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
            {photos.length < MAX_PHOTOS_FIL && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                <ImagePlus size={20} />
                Ajouter
                <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
              </label>
            )}
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Liens TikTok, YouTube, Facebook, site…</p>
          <LiensEditeur liens={liens} onChange={setLiens} max={MAX_LIENS_FIL} />
        </div>

        <p className="text-xs text-muted">
          Votre publication sera visible après validation par un administrateur. Pas de publicité ni de vente sur le fil : pour cela, utilisez Entreprises, Recommandés ou Demandes.
        </p>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Envoi..." : "Envoyer pour validation"}
        </button>
      </form>
    </AppShell>
  );
}
