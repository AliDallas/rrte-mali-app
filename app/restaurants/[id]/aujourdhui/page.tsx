"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, ImagePlus, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { MAX_PLATS_JOUR, Resto, aujourdhui, lireMenuJour, restoDepuisDoc } from "@/lib/restaurants";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const champ = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm";

interface Ligne {
  nom: string;
  prix: string;
  desc: string;
  photo: string;
}

/** Page rapide du restaurateur : publier ce qu'il propose aujourd'hui (nom, prix, photo). */
export default function MenuJourPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [resto, setResto] = useState<Resto | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([{ nom: "", prix: "", desc: "", photo: "" }]);
  const [dejaPublie, setDejaPublie] = useState(false);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    (async () => {
      try {
        const s = await getDoc(doc(db, "restos", id));
        if (!s.exists()) return setState("absent");
        const r = restoDepuisDoc(s.id, s.data());
        setResto(r);
        // On reprend le dernier menu publié (même d'hier) pour n'avoir qu'à le modifier
        const m = await lireMenuJour(id);
        if (m.items.length) {
          setLignes(m.items.map((p) => ({ nom: p.nom, prix: p.prix ? String(p.prix) : "", desc: p.desc, photo: p.photo })));
          setDejaPublie(m.date === aujourdhui());
        }
        setState("ok");
      } catch {
        setState("absent");
      }
    })();
  }, [id, profile]);

  const autorise = !!resto && (profile?.role === "admin" || resto.ownerUid === user?.uid);

  function maj(i: number, k: keyof Ligne, v: string) {
    setLignes(lignes.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  }

  async function photo(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      maj(i, "photo", await reduireImage(f, 480, 0.65));
    } catch {
      setErr("Cette photo n’a pas pu être lue.");
    }
  }

  async function publier(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const items = lignes
      .filter((l) => l.nom.trim())
      .map((l) => ({ nom: l.nom.trim(), prix: Number(l.prix) || 0, desc: l.desc.trim(), photo: l.photo }));
    if (items.length === 0) return setErr("Ajoutez au moins un plat.");
    if (items.map((p) => p.photo).join("").length > 700000) return setErr("Les photos sont trop lourdes : retirez-en quelques-unes.");
    setSaving(true);
    setErr("");
    try {
      const date = aujourdhui();
      await setDoc(doc(db, "restos", id, "medias", "jour"), { date, items });
      await updateDoc(doc(db, "restos", id), { menuJourDate: date, menuJourResume: items.map((p) => p.nom).join(" · ").slice(0, 140) });
      viderCache("restos");
      router.push(`/restaurants/${id}`);
    } catch {
      setErr("Impossible de publier. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  async function retirer() {
    if (!id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "restos", id), { menuJourDate: "", menuJourResume: "" });
      viderCache("restos");
      router.push(`/restaurants/${id}`);
    } catch {
      setErr("Impossible de retirer le menu. Réessayez.");
      setSaving(false);
    }
  }

  return (
    <AppShell title="Menu d’aujourd’hui" subtitle={resto?.nom ?? "Restaurants"}>
      <Link href={`/restaurants/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Retour à la fiche
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {state === "ok" && resto && !autorise && <p className="card p-6 text-center text-muted">Seul le propriétaire peut publier le menu du jour.</p>}
      {state === "ok" && resto && autorise && (
        <form onSubmit={publier} className="space-y-4">
          <div className="rounded-xl bg-gold-500/10 p-3 text-sm">
            Indiquez ce que vous proposez <b>aujourd’hui</b>. Le menu s’affiche sur votre fiche et dans la liste des restaurants jusqu’à la fin de la journée.
            Demain, vous retrouverez ces plats ici : il suffira de les modifier.
          </div>
          {dejaPublie && <div className="rounded-xl bg-[#E3F0DC] p-3 text-sm text-[#3C7026]">Le menu d’aujourd’hui est déjà publié. Vous pouvez le modifier.</div>}
          {err && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{err}</div>}

          <div className="card space-y-3 p-5">
            {lignes.map((l, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-line p-3">
                <div className="flex gap-2">
                  <input value={l.nom} onChange={(e) => maj(i, "nom", e.target.value)} placeholder="Nom du plat" className={champ} />
                  <input
                    value={l.prix}
                    onChange={(e) => maj(i, "prix", e.target.value)}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="Prix FCFA"
                    className={`${champ} w-32`}
                  />
                  {lignes.length > 1 && (
                    <button type="button" aria-label="Retirer ce plat" onClick={() => setLignes(lignes.filter((_, j) => j !== i))} className="px-1 text-muted">
                      <X size={18} />
                    </button>
                  )}
                </div>
                <input value={l.desc} onChange={(e) => maj(i, "desc", e.target.value)} placeholder="Description (facultatif)" className={champ} />
                {l.photo ? (
                  <div className="relative h-16 w-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    <button
                      type="button"
                      aria-label="Retirer la photo"
                      onClick={() => maj(i, "photo", "")}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-ink-fg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-xs text-muted">
                    <ImagePlus size={16} /> Photo du plat
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => photo(i, e)} />
                  </label>
                )}
              </div>
            ))}
            {lignes.length < MAX_PLATS_JOUR && (
              <button type="button" onClick={() => setLignes([...lignes, { nom: "", prix: "", desc: "", photo: "" }])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
                <Plus size={15} /> Ajouter un plat
              </button>
            )}
          </div>

          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Publication..." : "Publier le menu d’aujourd’hui"}
          </button>
          {resto.menuJourDate === aujourdhui() && (
            <button type="button" onClick={retirer} disabled={saving} className="btn-outline">
              Retirer le menu d’aujourd’hui
            </button>
          )}
        </form>
      )}
    </AppShell>
  );
}
