"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { EMAIL_GROUPE, LIEN_CONTACT } from "@/lib/contact";

/** Carte « Nous contacter » : ouvre la messagerie vers l'adresse du groupe, ou permet de copier l'adresse. */
export default function NousContacter() {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(EMAIL_GROUPE);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* l'adresse reste affichée : on peut la sélectionner à la main */
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
          <Mail size={20} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Nous contacter</p>
          <p className="select-all break-all text-sm text-muted">{EMAIL_GROUPE}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-line text-sm font-semibold">
        <a href={LIEN_CONTACT} className="flex items-center justify-center gap-2 bg-gold-500 py-3 text-ink">
          <Mail size={16} /> Écrire un message
        </a>
        <button onClick={copier} className="flex items-center justify-center gap-2 py-3 text-muted">
          {copie ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />} {copie ? "Copiée" : "Copier l’adresse"}
        </button>
      </div>
    </div>
  );
}
