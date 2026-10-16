"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  AVERTISSEMENT_DONS,
  CATEGORIES_STRUCTURE,
  LIBELLE_STRUCTURE,
  MAX_LIENS_STRUCTURE,
  MAX_PHOTOS_STRUCTURE,
  REGLES_ADMIN_STRUCTURE,
  Structure,
  TypeStructure,
  enregistrerPhotosStructure,
} from "@/lib/solidarite";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";
import LiensEditeur from "@/components/LiensEditeur";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

/** Création ou modification de la page d'une association ou d'un collectif (gérée par son seul administrateur). */
export default function StructureForm({
  type,
  structure,
  photosInitiales = [],
}: {
  type: TypeStructure;
  structure?: Structure;
  photosInitiales?: string[];
}) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const L = LIBELLE_STRUCTURE[type];
  const [nom, setNom] = useState(structure?.nom ?? "");
  const [categorie, setCategorie] = useState(structure?.categorie ?? "");
  const [description, setDescription] = useState(structure?.description ?? "");
  const [ville, setVille] = useState(structure?.ville ?? "Bamako");
  const [contact, setContact] = useState(structure?.contact ?? profile?.telephone ?? "");
  const [liens, setLiens] = useState<string[]>(structure?.liens.length ? structure.liens : [""]);
  const [infosDon, setInfosDon] = useState(structure?.infosDon ?? "");
  const [dons, setDons] = useState<{ libelle: string; url: string }[]>(structure?.liensDon.length ? structure.liensDon : []);
  const [photos, setPhotos] = useState<string[]>(photosInitiales);
  const [accepte, setAccepte] = useState(!!structure);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_STRUCTURE - photos.length);
    e.target.value = "";
    try {
      const nouvelles = await Promise.all(files.map((f) => reduireImage(f, 720, 0.65)));
      setPhotos((p) => [...p, ...nouvelles].slice(0, MAX_PHOTOS_STRUCTURE));
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
    const donsRemplis = dons.filter((d) => d.url.trim());
    const donsPropres = donsRemplis.map((d) => ({ libelle: d.libelle.trim() || "Faire un don", url: nettoyerLien(d.url) }));
    if (donsPropres.some((d) => !d.url)) return setError("Un des liens de don n’est pas valide.");
    if (photos.join("").length > 900000) return setError("Les photos sont trop lourdes ensemble : retirez-en une ou deux.");
    if (!accepte) return setError("Vous devez accepter l’engagement de l’administrateur.");
    setSaving(true);
    setError("");
    const donnees = {
      type,
      nom: nom.trim(),
      categorie,
      description: description.trim(),
      ville: ville.trim(),
      contact: contact.trim(),
      liens: propres,
      liensDon: donsPropres,
      infosDon: infosDon.trim(),
    };
    try {
      let id = structure?.id;
      if (structure) {
        await updateDoc(doc(db, "structures", structure.id), donnees);
      } else {
        const ref = await addDoc(collection(db, "structures"), {
          ...donnees,
          vignette: "",
          statut: profile.role === "admin" ? "valide" : "en_attente",
          ownerUid: user.uid,
          ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
          createdAt: serverTimestamp(),
        });
        id = ref.id;
      }
      if (id) {
        const vignette = await enregistrerPhotosStructure(id, photos);
        await updateDoc(doc(db, "structures", id), { vignette });
      }
      viderCache("structures");
      router.push(`/solidarite/structure/${id}`);
    } catch {
      setError("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card space-y-3 p-5">
        <label className="block text-sm font-medium">
          Nom de l’{type === "association" ? "association" : "collectif"}
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Domaine d’action
          <select required value={categorie} onChange={(e) => setCategorie(e.target.value)} className={input}>
            <option value="">Choisir…</option>
            {CATEGORIES_STRUCTURE.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Présentation (qui êtes-vous, que faites-vous, comment aider)
          <textarea required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Ville
            <input value={ville} onChange={(e) => setVille(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-medium">
            Contact (téléphone / WhatsApp)
            <input value={contact} onChange={(e) => setContact(e.target.value)} inputMode="tel" className={input} />
          </label>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Photos / logo (jusqu’à {MAX_PHOTOS_STRUCTURE})</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <button type="button" aria-label="Retirer" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 rounded-full bg-ink p-1 text-ink-fg">
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS_STRUCTURE && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
              <ImagePlus size={18} /> Ajouter
              <input type="file" accept="image/*" multiple onChange={ajouterPhotos} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Nos liens (page Facebook, TikTok, YouTube, site…)</p>
        <LiensEditeur liens={liens} onChange={setLiens} max={MAX_LIENS_STRUCTURE} />
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Dons (facultatif)</p>
        <p className="text-xs text-muted">{AVERTISSEMENT_DONS}</p>
        {dons.map((d, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={d.libelle}
              onChange={(e) => setDons(dons.map((x, j) => (j === i ? { ...x, libelle: e.target.value } : x)))}
              placeholder="Intitulé (ex. Cagnotte, Orange Money)"
              className="w-2/5 rounded-2xl border border-line bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              value={d.url}
              onChange={(e) => setDons(dons.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
              placeholder="Lien du don"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-2xl border border-line bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <button type="button" aria-label="Retirer" onClick={() => setDons(dons.filter((_, j) => j !== i))} className="px-1 text-muted">
              <X size={18} />
            </button>
          </div>
        ))}
        {dons.length < 4 && (
          <button type="button" onClick={() => setDons([...dons, { libelle: "", url: "" }])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
            <Plus size={15} /> Ajouter un lien de don
          </button>
        )}
        <label className="block text-sm font-medium">
          Autres moyens de donner (texte libre : numéro Mobile Money, compte, remise en main propre…)
          <textarea rows={3} value={infosDon} onChange={(e) => setInfosDon(e.target.value)} className={input} />
        </label>
      </div>

      {!structure && (
        <div className="card space-y-3 p-5">
          <p className="text-sm font-semibold">Engagement de l’administrateur de {L.un === "association" ? "l’association" : "du collectif"}</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
            {REGLES_ADMIN_STRUCTURE.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-1" />
            Je m’engage à respecter ces règles.
          </label>
          <p className="text-xs text-muted">Votre page sera publiée après validation par un administrateur RRTE.</p>
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Enregistrement..." : structure ? "Enregistrer" : "Envoyer pour validation"}
      </button>
    </form>
  );
}
