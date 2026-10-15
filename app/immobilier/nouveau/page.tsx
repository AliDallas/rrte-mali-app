"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  BIENS, DEVISES_IMMO, EQUIPEMENTS, MAX_PHOTOS_IMMO, MEUBLES, PAPIERS, PERIODES, QUARTIERS_BAMAKO, TYPES_IMMO, TypeAnnonceImmo, VILLES_IMMO,
  enregistrerPhotosImmo,
} from "@/lib/immobilier";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

function Puces({ options, valeurs, onChange }: { options: string[]; valeurs: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => {
        const actif = valeurs.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(actif ? valeurs.filter((x) => x !== o) : [...valeurs, o])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${actif ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function NouvelleImmoPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<TypeAnnonceImmo | "">("");
  const [bien, setBien] = useState("");
  const [meuble, setMeuble] = useState("");
  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("Bamako");
  const [quartier, setQuartier] = useState("");
  const [prix, setPrix] = useState("");
  const [devise, setDevise] = useState("FCFA");
  const [periode, setPeriode] = useState("");
  const [negociable, setNegociable] = useState(false);
  const [surface, setSurface] = useState("");
  const [pieces, setPieces] = useState("");
  const [equipements, setEquipements] = useState<string[]>([]);
  const [papiers, setPapiers] = useState<string[]>([]);
  const [disponibleLe, setDisponibleLe] = useState("");
  const [description, setDescription] = useState("");
  const [tel, setTel] = useState(profile?.telephone ?? "");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const estLocation = type === "location" || type === "courte";
  const estVente = type === "vente";
  const estRecherche = type === "recherche";
  const periodeDefaut = type === "courte" ? "nuit" : type === "location" ? "mois" : "fixe";
  const sansDetails = bien === "Terrain / parcelle";

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_IMMO - photos.length);
    e.target.value = "";
    try {
      const nouvelles = await Promise.all(files.map((f) => reduireImage(f, 720, 0.65)));
      setPhotos((p) => [...p, ...nouvelles].slice(0, MAX_PHOTOS_IMMO));
    } catch {
      setError("Une photo n’a pas pu être lue.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !type) return;
    if (photos.join("").length > 900000) return setError("Les photos sont trop lourdes ensemble : retirez-en une ou deux.");
    setSaving(true);
    setError("");
    try {
      const admin = profile.role === "admin";
      const ref = await addDoc(collection(db, "immobilier"), {
        typeAnnonce: type,
        bien,
        meuble: estLocation && !sansDetails ? meuble : "",
        titre: titre.trim(),
        ville,
        quartier: quartier.trim(),
        prix: Number(prix) || 0,
        devise,
        periode: periode || periodeDefaut,
        negociable,
        surface: Number(surface) || 0,
        pieces: Number(pieces) || 0,
        equipements,
        papiers: estVente ? papiers : [],
        disponibleLe: disponibleLe.trim(),
        description: description.trim(),
        tel: tel.trim(),
        vignette: "",
        termine: false,
        statut: admin ? "valide" : "en_attente",
        ownerUid: user.uid,
        ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
        createdAt: serverTimestamp(),
      });
      if (photos.length) {
        const vignette = await enregistrerPhotosImmo(ref.id, photos);
        await updateDoc(ref, { vignette });
      }
      viderCache("immobilier");
      router.push(`/immobilier/${ref.id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  if (!type) {
    return (
      <AppShell title="Publier une annonce" subtitle="Que souhaitez-vous faire ?">
        <div className="space-y-3">
          {TYPES_IMMO.map((t) => (
            <button key={t.key} onClick={() => setType(t.key)} className="card block w-full p-4 text-left">
              <p className="font-display font-bold">{t.titre}</p>
              <p className="text-sm text-muted">{t.aide}</p>
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={TYPES_IMMO.find((t) => t.key === type)?.titre ?? "Annonce"} subtitle="Elle sera publiée après validation par un administrateur">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Titre de l’annonce
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Villa 4 chambres à ACI 2000" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Type de bien
            <select required value={bien} onChange={(e) => setBien(e.target.value)} className={input}>
              <option value="">Choisir…</option>
              {BIENS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          {estLocation && !sansDetails && (
            <div>
              <p className="text-sm font-medium">Meublé ou non</p>
              <div className="mt-2 flex gap-2">
                {MEUBLES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMeuble(m.key)}
                    className={`flex-1 rounded-full border px-3 py-2 text-sm ${meuble === m.key ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Ville
              <select value={ville} onChange={(e) => setVille(e.target.value)} className={input}>
                {VILLES_IMMO.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Quartier
              <input value={quartier} onChange={(e) => setQuartier(e.target.value)} list="quartiers-bamako" placeholder="Ex. Hamdallaye" className={input} />
              <datalist id="quartiers-bamako">{ville === "Bamako" && QUARTIERS_BAMAKO.map((q) => <option key={q} value={q} />)}</datalist>
            </label>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <p className="text-sm font-medium">{estRecherche ? "Budget" : "Prix"}</p>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              placeholder="Montant"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <select value={devise} onChange={(e) => setDevise(e.target.value)} className="rounded-2xl border border-line bg-white px-3">
              {DEVISES_IMMO.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <select value={periode || periodeDefaut} onChange={(e) => setPeriode(e.target.value)} className={input}>
            {PERIODES.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={negociable} onChange={(e) => setNegociable(e.target.checked)} /> Prix négociable
          </label>
          <p className="text-xs text-muted">Laissez vide si vous préférez en discuter.</p>
        </div>

        <div className="card space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Surface (m²)
              <input type="number" inputMode="numeric" min="0" value={surface} onChange={(e) => setSurface(e.target.value)} className={input} />
            </label>
            {!sansDetails && (
              <label className="block text-sm font-medium">
                Pièces ou chambres
                <input type="number" inputMode="numeric" min="0" value={pieces} onChange={(e) => setPieces(e.target.value)} className={input} />
              </label>
            )}
          </div>
          {estLocation && (
            <label className="block text-sm font-medium">
              Disponible à partir de
              <input value={disponibleLe} onChange={(e) => setDisponibleLe(e.target.value)} placeholder="Ex. Immédiatement, 1er décembre" className={input} />
            </label>
          )}
          {!sansDetails && !estRecherche && (
            <div>
              <p className="text-sm font-medium">Équipements</p>
              <Puces options={EQUIPEMENTS} valeurs={equipements} onChange={setEquipements} />
            </div>
          )}
          {estVente && (
            <div>
              <p className="text-sm font-medium">Papiers du bien</p>
              <Puces options={PAPIERS} valeurs={papiers} onChange={setPapiers} />
              <p className="mt-2 text-xs text-muted">À titre d’information. L’acheteur doit toujours vérifier les papiers lui-même.</p>
            </div>
          )}
          <label className="block text-sm font-medium">
            {estRecherche ? "Décrivez votre besoin" : "Description"}
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={estRecherche ? "Type de bien, quartier souhaité, durée, budget…" : "État du bien, environnement, conditions, ce qui est inclus…"}
              className={input}
            />
          </label>
        </div>

        {!estRecherche && (
          <div className="card space-y-3 p-5">
            <p className="text-sm font-medium">Photos (jusqu’à {MAX_PHOTOS_IMMO})</p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative h-24 w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="h-24 w-24 rounded-xl object-cover" />
                  <button
                    type="button"
                    aria-label="Retirer la photo"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-fg"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS_IMMO && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
                  <ImagePlus size={20} />
                  Ajouter
                  <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
                </label>
              )}
            </div>
          </div>
        )}

        <div className="card space-y-3 p-5">
          <label className="block text-sm font-medium">
            Téléphone ou WhatsApp pour vous joindre
            <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Envoi..." : "Envoyer pour validation"}
        </button>
      </form>
    </AppShell>
  );
}
