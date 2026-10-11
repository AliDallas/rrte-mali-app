"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { DonneesPresentation, texteBienvenue } from "@/lib/presentation";

/** Boutons pour copier la présentation d'un membre, ou l'ouvrir dans WhatsApp pour la publier dans le groupe. */
export default function CopierPresentation({ donnees }: { donnees: DonneesPresentation }) {
  const [copie, setCopie] = useState(false);
  const [voir, setVoir] = useState(false);
  const texte = texteBienvenue(donnees);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setVoir(true); // copie refusée : on affiche le texte pour le sélectionner à la main
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copier}
          className="flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-1.5 text-sm font-semibold text-ink"
        >
          {copie ? <Check size={15} /> : <Copy size={15} />}
          {copie ? "Copié !" : "Copier pour WhatsApp"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texte)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold"
        >
          <MessageCircle size={15} /> Ouvrir WhatsApp
        </a>
        <button type="button" onClick={() => setVoir((v) => !v)} className="px-2 py-1.5 text-sm text-muted underline">
          {voir ? "Masquer" : "Aperçu"}
        </button>
      </div>
      {voir && (
        <textarea
          readOnly
          value={texte}
          rows={10}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-2xl border border-line bg-white p-3 text-sm"
        />
      )}
    </div>
  );
}
