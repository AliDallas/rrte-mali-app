"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { TYPES_EVENEMENT_MEMBRES, enregistrerPhotosEvent } from "@/lib/events";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { aujourdhui } from "@/lib/voyages";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";
const MAX_PHOTOS = 3;

export default function ProposerEvenementPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const admin = profile?.role === "admin";
  const [titre, setTitre] = useState("");
  const [orgType, setOrgType] = useState<"membre" | "association">("membre");
  const [orgNom, setOrgNom] = useState("");
  const [type, setType] = useState("");
  const [typeAutre, setTypeAutre] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("");
  const [participation, setParticipation] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState(profile?.telephone ?? "");
  const [liens, setLiens] = useState<string[]>([""]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    e.target.value = "";
    try {
      const n = await Promise.all(files.map((f) => reduireImage(f, 800, 0.7)));
      setPhotos((p) => [...p, ...n].slice(0, MAX_PHOTOS));
    } catch {
      setError("Une photo n’a pas pu être lue.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const remplis = liens.filter((l) => l.trim());
    const propres = remplis.map(nettoyerLien).filter(Boolean);
    if (propres.length !== remplis.length) return setError("Un des liens n’est pas valide.");
    setSaving(true);
    setError("");
    try {
      const nomPersonne = `${profile.prenom} ${profile.nom}`.trim();
      const ref = await addDoc(collection(db, "events"), {
        titre: titre.trim(),
        date,
        heure,
        lieu: lieu.trim(),
        description: description.trim(),
        attendees: [],
        created_by: user.uid,
        categorie: "membres",
        organisateurType: orgType,
        organisateurNom: orgType === "association" ? orgNom.trim() : nomPersonne,
        typeEvenement: type === "Autre" ? typeAutre.trim() || "Autre" : type,
        participation: participation.trim(),
        contact: contact.trim(),
        liens: propres,
        vignette: "",
        statut: admin ? "valide" : "en_attente",
        createdAt: serverTimestamp(),
      });
      if (photos.length) {
        const vignette = await enregistrerPhotosEvent(ref.id, photos);
        await updateDoc(ref, { vignette });
      }
      router.push(`/evenements/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Proposer un événement" subtitle="Repas, atelier, activité, association…">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Titre
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Atelier cuisine" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Type d’événement
            <select required value={type} onChange={(e) => setType(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {TYPES_EVENEMENT_MEMBRES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {type === "Autre" && (
            <label className="block text-sm font-medium">
              Précisez le type d’événement
              <input required value={typeAutre} onChange={(e) => setTypeAutre(e.target.value)} placeholder="Ex. Brocante, tournoi, conférence…" className={input} />
            </label>
          )}
          <div>
            <p className="text-sm font-medium">Organisé par</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 text-sm">
              {([
                ["membre", "Moi, à titre personnel"],
                ["association", "Une association"],
              ] as ["membre" | "association", string][]).map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setOrgType(v)}
                  className={`rounded-full border px-3 py-2.5 font-semibold ${orgType === v ? "border-gold-500 bg-gold-100 text-gold-700" : "border-line text-muted"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {orgType === "association" && (
            <label className="block text-sm font-medium">
              Nom de l’association
              <input required value={orgNom} onChange={(e) => setOrgNom(e.target.value)} className={input} />
            </label>
          )}
        </div>

        <div className="card space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Date
              <input required type="date" min={aujourdhui()} value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            <label className="block text-sm font-medium">
              Heure
              <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={input} />
            </label>
          </div>
          <label className="block text-sm font-medium">
            Lieu
            <input required value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Quartier, adresse" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Participation (facultatif)
            <input value={participation} onChange={(e) => setParticipation(e.target.value)} placeholder="Gratuit, 5 000 FCFA, chacune apporte un plat…" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Description
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Programme, public concerné, inscription…" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Contact / WhatsApp
            <input required type="tel" value={contact} onChange={(e) => setContact(e.target.value)} className={input} />
          </label>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">Affiche ou photos (jusqu’à {MAX_PHOTOS})</p>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative h-24 w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <button type="button" aria-label="Retirer" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-fg">
                  <X size={14} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                <ImagePlus size={20} /> Ajouter
                <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
              </label>
            )}
          </div>
          <p className="pt-1 text-sm font-medium">Liens (Facebook, Instagram, TikTok, YouTube, Google Maps…)</p>
          {liens.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={l}
                onChange={(e) => setLiens(liens.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Collez le lien ici"
                inputMode="url"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {liens.length > 1 && (
                <button type="button" aria-label="Retirer" onClick={() => setLiens(liens.filter((_, j) => j !== i))} className="px-1 text-muted">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
          {liens.length < 3 && (
            <button type="button" onClick={() => setLiens([...liens, ""])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
              <Plus size={15} /> Ajouter un lien
            </button>
          )}
        </div>
        {!admin && <p className="text-sm text-muted">Votre événement sera publié après validation par un administrateur.</p>}
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Envoi..." : admin ? "Publier l’événement" : "Envoyer pour validation"}
        </button>
      </form>
    </AppShell>
  );
}
