"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ImagePlus, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CleTypePublication, TYPES_PUBLICATION } from "@/lib/solidarite";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import LiensEditeur from "@/components/LiensEditeur";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

/** Nouvelle publication sur la page d'une association ou d'un collectif (événement, actualité, affiche, appel aux dons). */
export default function PublicationForm({ structureId, onDone }: { structureId: string; onDone: () => void }) {
  const { user } = useAuth();
  const [type, setType] = useState<CleTypePublication>("actualite");
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [date, setDate] = useState("");
  const [lieu, setLieu] = useState("");
  const [liens, setLiens] = useState<string[]>([""]);
  const [affiche, setAffiche] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function choisirAffiche(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      setAffiche(await reduireImage(f, 900, 0.7));
    } catch {
      setError("Cette image n’a pas pu être lue.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const remplis = liens.filter((l) => l.trim());
    const propres = remplis.map(nettoyerLien).filter(Boolean);
    if (propres.length !== remplis.length) return setError("Un des liens n’est pas valide.");
    if (affiche.length > 700000) return setError("L’affiche est trop lourde : choisissez une image plus petite.");
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "structures", structureId, "publications"), {
        type,
        titre: titre.trim(),
        texte: texte.trim(),
        date,
        lieu: lieu.trim(),
        liens: propres,
        affiche,
        auteurUid: user.uid,
        creeLe: serverTimestamp(),
      });
      onDone();
    } catch {
      setError("Impossible de publier. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <p className="font-display font-bold">Nouvelle publication</p>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <label className="block text-sm font-medium">
        Type
        <select value={type} onChange={(e) => setType(e.target.value as CleTypePublication)} className={input}>
          {TYPES_PUBLICATION.map((t) => (
            <option key={t.cle} value={t.cle}>
              {t.libelle}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Titre
        <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={input} />
      </label>
      <label className="block text-sm font-medium">
        Texte
        <textarea rows={5} value={texte} onChange={(e) => setTexte(e.target.value)} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Date (si événement / action)
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Lieu
          <input value={lieu} onChange={(e) => setLieu(e.target.value)} className={input} />
        </label>
      </div>
      <div>
        <p className="text-sm font-medium">Affiche ou photo</p>
        {affiche ? (
          <div className="relative mt-2 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={affiche} alt="" className="max-h-56 rounded-xl" />
            <button type="button" aria-label="Retirer" onClick={() => setAffiche("")} className="absolute -right-1 -top-1 rounded-full bg-ink p-1 text-ink-fg">
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-muted">
            <ImagePlus size={18} /> Ajouter une affiche
            <input type="file" accept="image/*" onChange={choisirAffiche} className="hidden" />
          </label>
        )}
      </div>
      <div>
        <p className="text-sm font-medium">Liens (publication Facebook, vidéo TikTok, lien de don…)</p>
        <div className="mt-2">
          <LiensEditeur liens={liens} onChange={setLiens} max={4} />
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Publication..." : "Publier"}
      </button>
    </form>
  );
}
