"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Luggage, Users, HeartHandshake } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { DEVISES, PERSONNES_ACCOMPAGNEES, PERSONNES_BESOIN, TYPES_ANNONCE, TarifMode, TypeAnnonce, VILLES, aujourdhui } from "@/lib/voyages";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
const ICONES = { kilos: Luggage, accompagnateur: HeartHandshake, besoin: Users };

export default function NouveauVoyagePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const admin = profile?.role === "admin";
  const [type, setType] = useState<TypeAnnonce | "">("");
  const [depart, setDepart] = useState("");
  const [arrivee, setArrivee] = useState("Bamako");
  const [dateVol, setDateVol] = useState("");
  const [dateSouple, setDateSouple] = useState(false);
  const [compagnie, setCompagnie] = useState("");
  const [mode, setMode] = useState<TarifMode>("kilo");
  const [prixKilo, setPrixKilo] = useState("");
  const [prixValise, setPrixValise] = useState("");
  const [valiseDesc, setValiseDesc] = useState("");
  const [devise, setDevise] = useState("€");
  const [kilos, setKilos] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [personne, setPersonne] = useState("");
  const [agePersonne, setAgePersonne] = useState("");
  const [message, setMessage] = useState("");
  const [tel, setTel] = useState(profile?.telephone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const kilosType = type === "kilos";
  const accompagnement = type === "accompagnateur" || type === "besoin";
  // une offre d'accompagnement est relue par un administrateur avant d'être visible
  const aValider = type === "accompagnateur" && !admin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !type) return;
    if (kilosType && dateLimite && dateLimite > dateVol) return setError("La date limite de dépôt doit être avant la date du vol.");
    setSaving(true);
    setError("");
    try {
      const ref = await addDoc(collection(db, "voyages"), {
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        tel: tel.trim(),
        typeAnnonce: type,
        depart: depart.trim(),
        arrivee: arrivee.trim(),
        dateVol,
        dateSouple: accompagnement ? dateSouple : false,
        compagnie: compagnie.trim(),
        tarifMode: kilosType ? mode : "kilo",
        prixKilo: kilosType && mode !== "valise" ? Number(prixKilo) || 0 : 0,
        prixValise: kilosType && mode !== "kilo" ? Number(prixValise) || 0 : 0,
        valiseDesc: kilosType && mode !== "kilo" ? valiseDesc.trim() : "",
        devise,
        kilosDispo: kilosType ? Number(kilos) || 0 : 0,
        dateLimite: kilosType ? dateLimite : "",
        personne: accompagnement ? personne : "",
        agePersonne: type === "besoin" ? agePersonne.trim() : "",
        message: message.trim(),
        statut: aValider ? "en_attente" : "valide",
        createdAt: serverTimestamp(),
      });
      viderCache("voyages");
      router.push(`/voyages/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  if (!type) {
    return (
      <AppShell title="Nouvelle annonce" subtitle="Que voulez-vous faire ?">
        <div className="space-y-3">
          {TYPES_ANNONCE.map((t) => {
            const Icon = ICONES[t.key];
            return (
              <button key={t.key} onClick={() => setType(t.key)} className="card flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.98]">
                <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="font-display text-lg font-bold leading-snug">{t.titre}</p>
                  <p className="text-sm text-muted">{t.aide}</p>
                </div>
              </button>
            );
          })}
        </div>
      </AppShell>
    );
  }

  const titreType = TYPES_ANNONCE.find((t) => t.key === type)?.titre ?? "";

  return (
    <AppShell title="Nouvelle annonce" subtitle={titreType}>
      <datalist id="villes">
        {VILLES.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <button type="button" onClick={() => setType("")} className="mb-3 text-sm font-semibold text-gold-700">
        Changer de type d’annonce
      </button>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {accompagnement && (
          <div className="rounded-2xl bg-gold-100 p-4 text-sm text-gold-700">
            <p className="font-semibold">Avant de confier ou d’accompagner un enfant ou un parent</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Pour un mineur, renseignez-vous d’abord auprès de la compagnie aérienne : elle a souvent un service dédié aux enfants qui voyagent seuls.</li>
              <li>Demandez à la compagnie les documents exigés (autorisation des parents, pièces d’identité…).</li>
              <li>Parlez ensemble avant le départ, échangez les pièces d’identité, et sachez qui récupère la personne à l’arrivée.</li>
              <li>Ne mettez ni nom, ni photo, ni adresse de l’enfant dans l’annonce.</li>
            </ul>
          </div>
        )}

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
              {type === "besoin" ? "Date du voyage" : "Date du vol"}
              <input required type="date" min={aujourdhui()} value={dateVol} onChange={(e) => setDateVol(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium">
              Compagnie (facultatif)
              <input value={compagnie} onChange={(e) => setCompagnie(e.target.value)} placeholder="Air France" className={input} />
            </label>
          </div>
          {accompagnement && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dateSouple} onChange={(e) => setDateSouple(e.target.checked)} />
              {type === "besoin" ? "Les dates sont flexibles de quelques jours" : "Je peux décaler mon voyage de quelques jours"}
            </label>
          )}
          {kilosType && (
            <label className="block text-sm font-medium">
              Kilos disponibles (facultatif)
              <input type="number" min="0" inputMode="numeric" value={kilos} onChange={(e) => setKilos(e.target.value)} className={input} />
            </label>
          )}
        </div>

        {accompagnement && (
          <div className="card space-y-3 p-5">
            <label className="block text-sm font-medium">
              {type === "besoin" ? "Qui doit être accompagné ?" : "Je peux accompagner"}
              <select required value={personne} onChange={(e) => setPersonne(e.target.value)} className={input}>
                <option value="">Choisir…</option>
                {(type === "besoin" ? PERSONNES_BESOIN : PERSONNES_ACCOMPAGNEES).map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            {type === "besoin" && (
              <label className="block text-sm font-medium">
                Âge (facultatif)
                <input value={agePersonne} onChange={(e) => setAgePersonne(e.target.value)} placeholder="Ex. 9 ans, ou 75 ans" className={input} />
              </label>
            )}
          </div>
        )}

        {kilosType && (
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
        )}

        <div className="card space-y-3 p-5">
          {kilosType && (
            <label className="block text-sm font-medium">
              Date limite pour déposer les colis (facultatif)
              <input type="date" min={aujourdhui()} max={dateVol || undefined} value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={input} />
            </label>
          )}
          <label className="block text-sm font-medium">
            Message aux membres (facultatif)
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                kilosType
                  ? "Lieu de dépôt, produits interdits, conditions de paiement, remise du colis à Bamako…"
                  : type === "besoin"
                  ? "Aéroport de départ, qui accueille à l’arrivée, besoins particuliers (santé, mobilité)…"
                  : "Mon expérience, mes conditions, ce que je peux faire à l’aéroport et à l’arrivée…"
              }
              className={input}
            />
          </label>
          <label className="block text-sm font-medium">
            Téléphone / WhatsApp
            <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
          </label>
        </div>

        {aValider ? (
          <p className="text-sm text-muted">
            Par prudence, une offre pour accompagner un enfant ou une personne âgée est publiée après validation par un administrateur.
          </p>
        ) : (
          <p className="text-sm text-muted">
            {kilosType ? "Vous restez responsable de ce que vous transportez. Refusez tout colis dont vous ne connaissez pas le contenu." : "RRTE met les membres en relation sans être responsable des voyages."}
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Publication..." : aValider ? "Envoyer pour validation" : "Publier l’annonce"}
        </button>
      </form>
    </AppShell>
  );
}
