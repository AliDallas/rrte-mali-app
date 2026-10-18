"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { MATIERES_COURS, TypeCours, enregistrerPhotosCours } from "@/lib/cours";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
const MAX_PHOTOS = 3;
const MAX_LIENS = 4;

export default function NouveauCoursPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<TypeCours>("cours");
  const [matiere, setMatiere] = useState("");
  const [lieu, setLieu] = useState("");
  const [horaires, setHoraires] = useState("");
  const [prix, setPrix] = useState("");
  const [niveau, setNiveau] = useState("");
  const [telephone, setTelephone] = useState(profile?.telephone ?? "");
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
      const ref = await addDoc(collection(db, "cours"), {
        type,
        titre: titre.trim(),
        matiere,
        lieu: lieu.trim(),
        horaires: horaires.trim(),
        prix: prix.trim(),
        niveau: niveau.trim(),
        telephone: telephone.trim(),
        statut: profile.role === "admin" ? "valide" : "en_attente",
        description: description.trim(),
        liens: propres,
        vignette: "",
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        createdAt: serverTimestamp(),
      });
      if (photos.length) {
        const vignette = await enregistrerPhotosCours(ref.id, photos);
        await updateDoc(ref, { vignette });
      }
      router.push(`/cours/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Publier" subtitle="Une école, un centre ou un cours">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <div className="flex gap-2">
            {(["cours", "ecole"] as TypeCours[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold ${type === t ? "border-gold-500 bg-gold-500/15 text-gold-700" : "border-line text-muted"}`}
              >
                {t === "cours" ? "Un cours" : "Une école / un centre"}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium">
            {type === "cours" ? "Intitulé du cours" : "Nom de l’école ou du centre"}
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={type === "cours" ? "Ex. Cours d’arabe pour adultes" : "Ex. École Les Palmiers"} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Matière ou domaine
            <select required value={matiere} onChange={(e) => setMatiere(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {MATIERES_COURS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Lieu / adresse
            <input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex. ACI 2000, ou « à domicile », « en ligne »" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Horaires
            <input value={horaires} onChange={(e) => setHoraires(e.target.value)} placeholder="Ex. Lun–Ven 17h–19h, samedi matin" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Prix
            <input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="Ex. 15 000 FCFA / mois" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Public / niveau
            <input value={niveau} onChange={(e) => setNiveau(e.target.value)} placeholder="Ex. Enfants dès 6 ans, débutants" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Téléphone WhatsApp pour s’inscrire
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} inputMode="tel" placeholder="+223 …" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Programme, professeur, méthode, durée…" className={input} />
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
        <p className="text-center text-xs text-muted">Votre publication sera visible après validation par un administrateur.</p>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Publication..." : "Publier"}
        </button>
      </form>
    </AppShell>
  );
}
