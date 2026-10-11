"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { CATEGORIES, EntrepriseSaisie } from "@/lib/entreprises";
import { reduireImage } from "@/lib/image";

export default function EntrepriseForm({
  value,
  onChange,
  maxPhotos = 4,
  sombre = false,
  choixType = false,
}: {
  value: EntrepriseSaisie;
  onChange: (v: EntrepriseSaisie) => void;
  maxPhotos?: number;
  sombre?: boolean;
  choixType?: boolean;
}) {
  const [err, setErr] = useState("");
  const input = sombre
    ? "field-dark mt-1.5"
    : "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
  const lab = sombre ? "block text-sm text-ink-mute" : "block text-sm font-medium";
  const set = (k: keyof EntrepriseSaisie, v: string) => onChange({ ...value, [k]: v });

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setErr("");
    try {
      const places = maxPhotos - value.photos.length;
      const nouvelles = await Promise.all(files.slice(0, Math.max(0, places)).map((f) => reduireImage(f, 720, 0.7)));
      onChange({ ...value, photos: [...value.photos, ...nouvelles] });
      if (files.length > places) setErr(`${maxPhotos} photos maximum.`);
    } catch {
      setErr("Image illisible, essayez un autre fichier.");
    }
  }

  async function choisirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      onChange({ ...value, logo: await reduireImage(f, 256) });
    } catch {
      setErr("Image illisible, essayez un autre fichier.");
    }
  }

  return (
    <div className="space-y-3">
      {choixType && (
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["proprietaire", "C’est mon entreprise"],
              ["recommandation", "Je recommande"],
            ] as const
          ).map(([k, l]) => (
            <button
              type="button"
              key={k}
              onClick={() => set("type", k)}
              className={`rounded-full border px-3 py-2 text-sm ${
                value.type === k ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <label className={lab}>
        Nom de l’entreprise
        <input required value={value.nom} onChange={(e) => set("nom", e.target.value)} className={input} />
      </label>
      <label className={lab}>
        Catégorie
        <select required value={value.categorie} onChange={(e) => set("categorie", e.target.value)} className={input}>
          <option value="">Choisir…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className={lab}>
        Présentation (activité, produits, services)
        <textarea rows={3} value={value.description} onChange={(e) => set("description", e.target.value)} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={lab}>
          Quartier
          <input value={value.quartier} onChange={(e) => set("quartier", e.target.value)} className={input} />
        </label>
        <label className={lab}>
          Téléphone / WhatsApp
          <input type="tel" value={value.tel} onChange={(e) => set("tel", e.target.value)} className={input} />
        </label>
      </div>
      <label className={lab}>
        Adresse précise (repère)
        <input value={value.adresse} onChange={(e) => set("adresse", e.target.value)} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={lab}>
          E-mail
          <input type="email" value={value.email} onChange={(e) => set("email", e.target.value)} className={input} />
        </label>
        <label className={lab}>
          Site web
          <input value={value.siteWeb} onChange={(e) => set("siteWeb", e.target.value)} className={input} />
        </label>
      </div>
      <label className={lab}>
        Liens : Facebook, Instagram, TikTok, vidéos YouTube… (un par ligne)
        <textarea rows={3} value={value.liens} onChange={(e) => set("liens", e.target.value)} className={input} />
      </label>
      <label className={lab}>
        Horaires
        <input value={value.horaires} onChange={(e) => set("horaires", e.target.value)} placeholder="Lun–Sam 8h–19h" className={input} />
      </label>

      <div className={lab}>
        Logo
        <div className="mt-1.5 flex items-center gap-3">
          {value.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.logo} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
          )}
          <input type="file" accept="image/*" onChange={choisirLogo} className="text-sm" />
        </div>
      </div>

      <div className={lab}>
        Photos ({value.photos.length}/{maxPhotos})
        <div className="mt-1.5 flex flex-wrap gap-2">
          {value.photos.map((p, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <button
                type="button"
                aria-label="Retirer la photo"
                onClick={() => onChange({ ...value, photos: value.photos.filter((_, j) => j !== i) })}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {value.photos.length < maxPhotos && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-muted text-xs text-muted">
              <ImagePlus size={20} />
              Ajouter
              <input type="file" accept="image/*" multiple onChange={ajouterPhotos} className="hidden" />
            </label>
          )}
        </div>
      </div>
      {err && <p className="text-sm text-brand-red">{err}</p>}
    </div>
  );
}
