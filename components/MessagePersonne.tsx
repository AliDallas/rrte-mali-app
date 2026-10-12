"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { chiffres } from "@/lib/fiches";

/** Un message prêt à envoyer à une personne : bouton Copier + ouverture directe de sa conversation WhatsApp. */
export default function MessagePersonne({ tel, message, sansApercu }: { tel: string; message: string; sansApercu?: boolean }) {
  const [copie, setCopie] = useState(false);
  const [voir, setVoir] = useState(false);
  const num = chiffres(tel);

  async function copier() {
    try {
      await navigator.clipboard.writeText(message);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      setVoir(true);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {num && (
          <a
            href={`https://wa.me/${num}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-1.5 text-sm font-semibold text-ink"
          >
            <MessageCircle size={15} /> Envoyer par WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={copier}
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold"
        >
          {copie ? <Check size={15} /> : <Copy size={15} />}
          {copie ? "Copié !" : "Copier le message"}
        </button>
        {!sansApercu && (
          <button type="button" onClick={() => setVoir((v) => !v)} className="px-2 py-1.5 text-sm text-muted underline">
            {voir ? "Masquer" : "Aperçu"}
          </button>
        )}
      </div>
      {voir && (
        <textarea
          readOnly
          value={message}
          rows={9}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-2xl border border-line bg-white p-3 text-sm"
        />
      )}
    </div>
  );
}
