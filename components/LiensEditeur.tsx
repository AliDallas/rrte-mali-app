"use client";

import { Plus, X } from "lucide-react";

/** Liste de liens modifiable (Facebook, TikTok, site, etc.). Le nettoyage se fait à l'envoi avec nettoyerLien. */
export default function LiensEditeur({
  liens,
  onChange,
  max = 6,
  placeholder = "Collez le lien ici (Facebook, TikTok, site…)",
}: {
  liens: string[];
  onChange: (l: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const liste = liens.length ? liens : [""];
  return (
    <div className="space-y-2">
      {liste.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={l}
            onChange={(e) => onChange(liste.map((y, j) => (j === i ? e.target.value : y)))}
            placeholder={placeholder}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          {liste.length > 1 && (
            <button type="button" aria-label="Retirer" onClick={() => onChange(liste.filter((_, j) => j !== i))} className="px-1 text-muted">
              <X size={18} />
            </button>
          )}
        </div>
      ))}
      {liste.length < max && (
        <button type="button" onClick={() => onChange([...liste, ""])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
          <Plus size={15} /> Ajouter un lien
        </button>
      )}
    </div>
  );
}
