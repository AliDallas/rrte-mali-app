"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ImagePlus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import LiensEditeur from "@/components/LiensEditeur";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_STRUCTURE } from "@/lib/solidarite";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function NouvelleInitiativePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [categorie, setCategorie] = useState("");
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
    if (!user || !profile) return;
    const remplis = liens.filter((l) => l.trim());
    const propres = remplis.map(nettoyerLien).filter(Boolean);
    if (propres.length !== remplis.length) return setError("Un des liens n’est pas valide.");
    if (affiche.length > 700000) return setError("L’affiche est trop lourde : choisissez une image plus petite.");
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "initiatives"), {
        titre: titre.trim(),
        texte: texte.trim(),
        categorie,
        date,
        lieu: lieu.trim(),
        liens: propres,
        affiche,
        statut: profile.role === "admin" ? "valide" : "en_attente",
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        creeLe: serverTimestamp(),
      });
      viderCache("initiatives");
      router.push(`/solidarite/initiatives/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Proposer une initiative" subtitle="Publiée après validation par un administrateur">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Titre
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Domaine
            <select required value={categorie} onChange={(e) => setCategorie(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {CATEGORIES_STRUCTURE.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Description (ce que vous faites, comment les membres peuvent participer)
            <textarea required rows={6} value={texte} onChange={(e) => setTexte(e.target.value)} className={input} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Date (facultatif)
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium">
              Lieu
              <input value={lieu} onChange={(e) => setLieu(e.target.value)} className={input} />
            </label>
          </div>
        </div>
        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Affiche ou photo</p>
          {affiche ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={affiche} alt="" className="max-h-56 rounded-xl" />
              <button type="button" aria-label="Retirer" onClick={() => setAffiche("")} className="absolute -right-1 -top-1 rounded-full bg-ink p-1 text-ink-fg">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-muted">
              <ImagePlus size={18} /> Ajouter une affiche
              <input type="file" accept="image/*" onChange={choisirAffiche} className="hidden" />
            </label>
          )}
          <p className="text-sm font-medium">Liens (page Facebook, TikTok, YouTube…)</p>
          <LiensEditeur liens={liens} onChange={setLiens} max={4} />
        </div>
        <p className="text-xs text-muted">
          RRTE et son application ne sont pas responsables du contenu des initiatives, notamment au regard du droit malien. Chaque publication relève de la seule responsabilité de son auteur.
        </p>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Envoi..." : "Envoyer pour validation"}
        </button>
      </form>
    </AppShell>
  );
}
