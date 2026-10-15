"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ImagePlus, Plus, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_MENU, CUISINES, MAX_PHOTOS_RESTO, MAX_PLATS, Resto, SERVICES, enregistrerPhotosResto } from "@/lib/restaurants";
import { nettoyerLien } from "@/lib/liens";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

interface PlatSaisie {
  cat: string;
  nom: string;
  prix: string;
  desc: string;
}

/** Formulaire de création ou de modification d'une fiche restaurant (le propriétaire gère lui-même son menu). */
export default function RestoForm({ resto, photosInitiales = [] }: { resto?: Resto; photosInitiales?: string[] }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [nom, setNom] = useState(resto?.nom ?? "");
  const [cuisine, setCuisine] = useState(resto?.cuisine ?? "");
  const [description, setDescription] = useState(resto?.description ?? "");
  const [adresse, setAdresse] = useState(resto?.adresse ?? "");
  const [quartier, setQuartier] = useState(resto?.quartier ?? "");
  const [horaires, setHoraires] = useState(resto?.horaires ?? "");
  const [tel, setTel] = useState(resto?.tel ?? profile?.telephone ?? "");
  const [services, setServices] = useState<string[]>(resto?.services ?? []);
  const [platDuJour, setPlatDuJour] = useState(resto?.platDuJour ?? "");
  const [menu, setMenu] = useState<PlatSaisie[]>(
    resto?.menu.map((p) => ({ cat: p.cat, nom: p.nom, prix: p.prix ? String(p.prix) : "", desc: p.desc })) ?? []
  );
  const [liens, setLiens] = useState<string[]>(resto?.liens.length ? resto.liens : [""]);
  const [photos, setPhotos] = useState<string[]>(photosInitiales);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS_RESTO - photos.length);
    e.target.value = "";
    try {
      const nouvelles = await Promise.all(files.map((f) => reduireImage(f, 720, 0.65)));
      setPhotos((p) => [...p, ...nouvelles].slice(0, MAX_PHOTOS_RESTO));
    } catch {
      setError("Une photo n’a pas pu être lue.");
    }
  }

  function majPlat(i: number, champ: keyof PlatSaisie, v: string) {
    setMenu(menu.map((p, j) => (j === i ? { ...p, [champ]: v } : p)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const propres = liens.map(nettoyerLien).filter(Boolean);
    if (liens.some((l) => l.trim()) && propres.length !== liens.filter((l) => l.trim()).length) {
      return setError("Un des liens n’est pas valide.");
    }
    if (photos.join("").length > 900000) return setError("Les photos sont trop lourdes ensemble : retirez-en une ou deux.");
    setSaving(true);
    setError("");
    const donnees = {
      nom: nom.trim(),
      cuisine,
      description: description.trim(),
      adresse: adresse.trim(),
      quartier: quartier.trim(),
      ville: "Bamako",
      horaires: horaires.trim(),
      tel: tel.trim(),
      services,
      liens: propres,
      platDuJour: platDuJour.trim(),
      menu: menu
        .filter((p) => p.nom.trim())
        .map((p) => ({ cat: p.cat || "Plats", nom: p.nom.trim(), prix: Number(p.prix) || 0, desc: p.desc.trim() })),
    };
    try {
      let id = resto?.id;
      if (resto) {
        await updateDoc(doc(db, "restos", resto.id), donnees);
      } else {
        const ref = await addDoc(collection(db, "restos"), {
          ...donnees,
          vignette: "",
          nbAvis: 0,
          sommeNotes: 0,
          statut: profile.role === "admin" ? "valide" : "en_attente",
          ownerUid: user.uid,
          ownerNom: `${profile.prenom} ${profile.nom}`.trim(),
          createdAt: serverTimestamp(),
        });
        id = ref.id;
      }
      if (id) {
        const vignette = await enregistrerPhotosResto(id, photos);
        await updateDoc(doc(db, "restos", id), { vignette });
      }
      viderCache("restos");
      router.push(`/restaurants/${id}`);
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
          Nom du restaurant
          <input required value={nom} onChange={(e) => setNom(e.target.value)} className={input} />
        </label>
        <label className="block text-sm font-medium">
          Type de cuisine
          <select required value={cuisine} onChange={(e) => setCuisine(e.target.value)} className={input}>
            <option value="">Choisir…</option>
            {CUISINES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Présentation
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Votre spécialité, l’ambiance, ce qui vous distingue…" className={input} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Quartier
            <input required value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Ex. ACI 2000" className={input} />
          </label>
          <label className="block text-sm font-medium">
            Téléphone / WhatsApp
            <input required type="tel" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Adresse précise
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, repère connu…" className={input} />
        </label>
        <label className="block text-sm font-medium">
          Horaires
          <input value={horaires} onChange={(e) => setHoraires(e.target.value)} placeholder="Ex. Tous les jours 11h-23h, fermé le lundi" className={input} />
        </label>
        <div>
          <p className="text-sm font-medium">Services</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICES.map((s) => {
              const actif = services.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServices(actif ? services.filter((x) => x !== s) : [...services, s])}
                  className={`rounded-full border px-3 py-1.5 text-sm ${actif ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Plat du jour (facultatif)</p>
        <input value={platDuJour} onChange={(e) => setPlatDuJour(e.target.value)} placeholder="Ex. Riz au gras, 2 500 FCFA" className={input} />
        <p className="pt-2 text-sm font-medium">Menu</p>
        <p className="text-xs text-muted">Vous pourrez le modifier à tout moment, par exemple chaque jour.</p>
        {menu.map((p, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-line p-3">
            <div className="flex gap-2">
              <select value={p.cat || "Plats"} onChange={(e) => majPlat(i, "cat", e.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm">
                {CATEGORIES_MENU.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button type="button" aria-label="Retirer ce plat" onClick={() => setMenu(menu.filter((_, j) => j !== i))} className="px-1 text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-2">
              <input value={p.nom} onChange={(e) => majPlat(i, "nom", e.target.value)} placeholder="Nom du plat" className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
              <input
                value={p.prix}
                onChange={(e) => majPlat(i, "prix", e.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Prix FCFA"
                className="w-32 rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
            <input value={p.desc} onChange={(e) => majPlat(i, "desc", e.target.value)} placeholder="Description (facultatif)" className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm" />
          </div>
        ))}
        {menu.length < MAX_PLATS && (
          <button type="button" onClick={() => setMenu([...menu, { cat: "Plats", nom: "", prix: "", desc: "" }])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
            <Plus size={15} /> Ajouter un plat
          </button>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Photos : restaurant, plats, carte (jusqu’à {MAX_PHOTOS_RESTO})</p>
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
          {photos.length < MAX_PHOTOS_RESTO && (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-xs text-muted">
              <ImagePlus size={20} />
              Ajouter
              <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} />
            </label>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium">Liens : Facebook, TikTok, YouTube, Google Maps…</p>
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
              <button type="button" aria-label="Retirer le lien" onClick={() => setLiens(liens.filter((_, j) => j !== i))} className="px-1 text-muted">
                <X size={18} />
              </button>
            )}
          </div>
        ))}
        {liens.length < 4 && (
          <button type="button" onClick={() => setLiens([...liens, ""])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
            <Plus size={15} /> Ajouter un lien
          </button>
        )}
      </div>

      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Enregistrement..." : resto ? "Enregistrer les modifications" : "Envoyer pour validation"}
      </button>
    </form>
  );
}
