"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { ChevronLeft, ExternalLink, MapPin, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Loisir, lirePhotosLoisir, loisirDepuisDoc } from "@/lib/loisirs";
import { idYoutube, plateforme } from "@/lib/liens";
import { viderCache } from "@/lib/cache";

export default function LoisirDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [l, setL] = useState<Loisir | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "loisirs", id))
      .then((s) => {
        if (!s.exists()) return setState("absent");
        setL(loisirDepuisDoc(s.id, s.data()));
        setState("ok");
        lirePhotosLoisir(id).then(setPhotos);
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "loisirs", id));
    viderCache("loisirs");
    router.push("/loisirs");
  }

  const peutGerer = !!l && (profile?.role === "admin" || l.ownerUid === user?.uid);
  const videos = (l?.liens ?? []).map(idYoutube).filter(Boolean);

  return (
    <AppShell title={l?.titre || "Loisir"} subtitle={l?.categorie || "Partagé par un membre"}>
      <Link href="/loisirs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Loisirs
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable ou supprimée.</p>}
      {state === "ok" && l && (
        <div className="space-y-4">
          {photos.length > 0 && (
            <div className="flex snap-x gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt="" className="h-56 w-[85%] flex-none snap-center rounded-2xl object-cover" />
              ))}
            </div>
          )}
          <div className="card space-y-2 p-5">
            {l.description && <p className="whitespace-pre-line text-[15px]">{l.description}</p>}
            {l.adresse && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <MapPin size={16} className="text-gold-600" /> {l.adresse}
              </p>
            )}
            {l.ownerNom && <p className="text-xs font-semibold text-gold-700">Partagé par {l.ownerNom}</p>}
          </div>

          {videos.map((v) => (
            <div key={v} className="overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${v}`}
                title="Vidéo YouTube"
                className="aspect-video w-full"
                allow="encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ))}

          {l.liens.length > 0 && (
            <div className="card divide-y divide-line">
              {l.liens.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3">
                  <ExternalLink size={17} className="text-gold-600" />
                  <span className="flex-1 text-[15px] font-semibold">Ouvrir sur {plateforme(u)}</span>
                </a>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <SignalerBouton cibleType="fiche" cibleId={l.id} cibleNom={`Fiche « ${l.titre} »`} cibleUid={l.ownerUid} libelle="Signaler cette annonce ou ce contenu" />
          </div>

          {peutGerer &&
            (confirm ? (
              <div className="flex gap-2">
                <button onClick={supprimer} className="flex-1 rounded-full bg-brand-red px-4 py-3 text-sm font-semibold text-white">
                  Confirmer la suppression
                </button>
                <button onClick={() => setConfirm(false)} className="btn-outline flex-1">
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="flex w-full items-center justify-center gap-2 text-sm text-muted">
                <Trash2 size={15} /> Supprimer cette fiche
              </button>
            ))}
        </div>
      )}
    </AppShell>
  );
}
