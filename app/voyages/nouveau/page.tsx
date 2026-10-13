"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { DEVISES, TarifMode, VILLES, aujourdhui } from "@/lib/voyages";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function NouveauVoyagePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("Bamako");
  const [dateVol, setDateVol] = useState("");
  const [compagnie, setCompagnie] = useState("");
  const [mode, setMode] = useState<TarifMode>("kilo");
  const [prixKilo, setPrixKilo] = useState("");
  const [prixValise, setPrixValise] = useState("");
  const [valiseDesc, setValiseDesc] = useState("");
  const [devise, setDevise] = useState("€");
  const [kilos, setKilos] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [message, setMessage] = useState("");
  const [tel, setTel] = useState(profile?.telephone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    if (dateLimite && dateLimite > dateVol) return setError("La date limite de dépôt doit être avant la date du vol.");
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "voyages"), {
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        tel: tel.trim(),
        depart: depart.trim(),
        arrivee: arrivee.trim(),
        dateVol,
        compagnie: compagnie.trim(),
        tarifMode: mode,
        prixKilo: mode !== "valise" ? Number(prixKilo) || 0 : 0,
        prixValise: mode !== "kilo" ? Number(prixValise) || 0 : 0,
        valiseDesc: mode !== "kilo" ? valiseDesc.trim() : "",
        devise,
        kilosDispo: Number(kilos) || 0,
        dateLimite,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      viderCache("voyages");
      router.push(`/voyages/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Proposer mes kilos" subtitle="Annonce visible par les membres jusqu’à la date du vol">
      <datalist id="villes">
        {VILLES.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Départ
              <input required list="villes" value={depart} onChange={(e) => setDepart(e.target.value)} placeholder="Paris" className={input} />
            </label>
            <label className="block text-sm font-medium">
              Arrivée
              <input required list="villes" value={arrivee} onChange={(e) => setArrivee(e.target.value)} className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Date du vol
              <input required type="date" min={aujourdhui()} value={dateVol} onChange={(e) => setDateVol(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium">
              Compagnie (facultatif)
              <input value={compagnie} onChange={(e) => setCompagnie(e.target.value)} placeholder="Air France" className={input} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Kilos disponibles (facultatif)
            <input type="number" min="0" inputMode="numeric" value={kilos} onChange={(e) => setKilos(e.target.value)} className={input} />
          </label>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Comment vendez-vous ?</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {([
              ["kilo", "Au kilo"],
              ["valise", "À la valise"],
              ["les_deux", "Les deux"],
            ] as [TarifMode, string][]).map(([v, l]) => (
              <button
                type="button"
                key={v}
                onClick={() => setMode(v)}
                className={`rounded-full border px-2 py-2.5 font-semibold ${mode === v ? "border-gold-500 bg-gold-100 text-gold-700" : "border-line text-muted"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium">
            Devise
            <select value={devise} onChange={(e) => setDevise(e.target.value)} className={input}>
              {DEVISES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          {mode !== "valise" && (
            <label className="block text-sm font-medium">
              Prix par kilo
              <input type="number" min="0" inputMode="decimal" value={prixKilo} onChange={(e) => setPrixKilo(e.target.value)} className={input} />
            </label>
          )}
          {mode !== "kilo" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Prix de la valise
                <input type="number" min="0" inputMode="decimal" value={prixValise} onChange={(e) => setPrixValise(e.target.value)} className={input} />
              </label>
              <label className="block text-sm font-medium">
                Description
                <input value={valiseDesc} onChange={(e) => setValiseDesc(e.target.value)} placeholder="Valise 23 kg" className={input} />
              </label>
            </div>
          )}
        </div>

        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Date limite pour déposer les colis (facultatif)
            <input type="date" min={aujourdhui()} max={dateVol || undefined} value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Message aux membres (facultatif)
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Lieu de dépôt, produits interdits, conditions de paiement, remise du colis à Bamako…"
              className={input}
            />
          </label>
          <label className="block text-sm font-medium">
            Téléphone / WhatsApp
            <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
          </label>
        </div>
        <p className="text-sm text-muted">
          Vous restez responsable de ce que vous transportez. Refusez tout colis dont vous ne connaissez pas le contenu.
        </p>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Publication..." : "Publier l’annonce"}
        </button>
      </form>
    </AppShell>
  );
}
