"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { CATEGORIES_DEMARCHES, LIEUX_DEMARCHES } from "@/lib/demarches";
import { nettoyerLien } from "@/lib/liens";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export interface DemarcheSaisie {
  titre: string;
  categorie: string;
  lieu: string;
  resume: string;
  etapes: string;
  pieces: string;
  cout: string;
  delai: string;
  adresse: string;
  liens: string[];
  verifieLe: string;
}

export function saisieDemarcheVide(): DemarcheSaisie {
  return { titre: "", categorie: "", lieu: "", resume: "", etapes: "", pieces: "", cout: "", delai: "", adresse: "", liens: [""], verifieLe: "" };
}

export default function DemarcheForm({
  initial,
  envoi,
  libelle,
  onSubmit,
  erreur,
}: {
  initial: DemarcheSaisie;
  envoi: boolean;
  libelle: string;
  erreur: string;
  onSubmit: (d: DemarcheSaisie & { liensPropres: string[] }) => void;
}) {
  const [d, setD] = useState<DemarcheSaisie>({ ...initial, liens: initial.liens.length ? initial.liens : [""] });
  const [err, setErr] = useState("");
  const set = (k: keyof DemarcheSaisie, v: string) => setD((x) => ({ ...x, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const remplis = d.liens.filter((l) => l.trim());
    const propres = remplis.map(nettoyerLien).filter(Boolean);
    if (propres.length !== remplis.length) return setErr("Un des liens n’est pas valide.");
    setErr("");
    onSubmit({ ...d, liensPropres: propres });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {(err || erreur) && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err || erreur}</div>}
      <div className="card space-y-3 p-5">
        <label className="block text-sm font-medium">
          Titre de la démarche
          <input required value={d.titre} onChange={(e) => set("titre", e.target.value)} placeholder="Ex. Obtenir un acte de naissance malien" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Catégorie
          <select required value={d.categorie} onChange={(e) => set("categorie", e.target.value)} className={input}>
            <option value="">Choisir…</option>
            {CATEGORIES_DEMARCHES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Où se fait la démarche ?
          <select required value={d.lieu} onChange={(e) => set("lieu", e.target.value)} className={input}>
            <option value="">Choisir…</option>
            {LIEUX_DEMARCHES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          En deux mots
          <textarea rows={2} value={d.resume} onChange={(e) => set("resume", e.target.value)} className={input} />
        </label>
      </div>

      <div className="card space-y-3 p-5">
        <label className="block text-sm font-medium">
          Étapes (une par ligne)
          <textarea rows={5} value={d.etapes} onChange={(e) => set("etapes", e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Pièces à fournir (une par ligne)
          <textarea rows={5} value={d.pieces} onChange={(e) => set("pieces", e.target.value)} className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Coût
            <input value={d.cout} onChange={(e) => set("cout", e.target.value)} placeholder="Ex. 5 000 FCFA" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Délai
            <input value={d.delai} onChange={(e) => set("delai", e.target.value)} placeholder="Ex. 2 à 3 semaines" className={input} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Où aller (adresse, service, horaires)
          <textarea rows={2} value={d.adresse} onChange={(e) => set("adresse", e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Information vérifiée le
          <input type="date" value={d.verifieLe} onChange={(e) => set("verifieLe", e.target.value)} className={input} />
        </label>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Liens officiels ou utiles</p>
        {d.liens.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={l}
              onChange={(e) => setD((x) => ({ ...x, liens: x.liens.map((y, j) => (j === i ? e.target.value : y)) }))}
              placeholder="Collez le lien ici"
              inputMode="url"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            {d.liens.length > 1 && (
              <button type="button" aria-label="Retirer" onClick={() => setD((x) => ({ ...x, liens: x.liens.filter((_, j) => j !== i) }))} className="px-1 text-muted">
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        {d.liens.length < 5 && (
          <button type="button" onClick={() => setD((x) => ({ ...x, liens: [...x.liens, ""] }))} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
            <Plus size={15} /> Ajouter un lien
          </button>
        )}
      </div>
      <button type="submit" disabled={envoi} className="btn-gold">
        {envoi ? "Enregistrement..." : libelle}
      </button>
    </form>
  );
}
