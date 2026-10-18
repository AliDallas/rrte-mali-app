"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, limit, orderBy, query, updateDoc } from "firebase/firestore";
import { ChevronLeft, ExternalLink, Heart, Plus, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import SignalerBouton from "@/components/SignalerBouton";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Publication, depuis, lirePhotosFil, publicationDepuisDoc } from "@/lib/fil";
import { idYoutube, plateforme } from "@/lib/liens";
import { viderCache } from "@/lib/cache";

const PAR_PAGE = 20;

export default function FilPage() {
  const { user, profile } = useAuth();
  const admin = profile?.role === "admin";
  const [posts, setPosts] = useState<Publication[] | null>(null);
  const [photos, setPhotos] = useState<Record<string, string[]>>({});
  const [nb, setNb] = useState(PAR_PAGE);
  const [zoom, setZoom] = useState("");
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const r = await getDocs(query(collection(db, "fil"), orderBy("creeLe", "desc"), limit(nb)));
      const liste = r.docs.map((d) => publicationDepuisDoc(d.id, d.data()));
      setPosts(liste);
      liste.filter((p) => p.nbPhotos > 0).forEach((p) => lirePhotosFil(p.id).then((ph) => setPhotos((x) => ({ ...x, [p.id]: ph }))));
    } catch {
      setPosts([]);
      setErreur("Impossible de charger le fil. Réessayez dans un instant.");
    }
  }, [nb]);

  useEffect(() => {
    if (profile?.statut === "actif") charger();
  }, [profile, charger]);

  // Chacun voit les publications validées ; l'auteur voit aussi les siennes en attente ; un administrateur voit tout.
  const visibles = (posts ?? []).filter((p) => p.statut === "valide" || p.ownerUid === user?.uid || admin);

  async function aimer(p: Publication) {
    if (!user) return;
    const deja = p.aimes.includes(user.uid);
    setPosts((l) => (l ?? []).map((x) => (x.id === p.id ? { ...x, aimes: deja ? x.aimes.filter((u) => u !== user.uid) : [...x.aimes, user.uid] } : x)));
    try {
      await updateDoc(doc(db, "fil", p.id), { aimes: deja ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    } catch {
      charger();
    }
  }

  async function valider(p: Publication) {
    await updateDoc(doc(db, "fil", p.id), { statut: "valide" });
    viderCache("fil");
    charger();
  }

  async function supprimer(p: Publication) {
    await deleteDoc(doc(db, "fil", p.id));
    viderCache("fil");
    charger();
  }

  return (
    <AppShell title="Fil d’actualité" subtitle="Les nouvelles du groupe">
      <Link href="/accueil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Accueil
      </Link>
      <Link href="/fil/nouveau" className="btn-gold mb-4 flex items-center justify-center gap-2">
        <Plus size={18} /> Publier une nouvelle
      </Link>
      {erreur && <div className="mb-4 rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
      {posts === null && <p className="text-center text-muted">Chargement...</p>}
      {posts && visibles.length === 0 && !erreur && <p className="card p-6 text-center text-muted">Aucune publication pour l’instant. Soyez le premier à partager une nouvelle !</p>}

      <div className="space-y-4">
        {visibles.map((p) => {
          const imgs = photos[p.id] ?? [];
          const aime = !!user && p.aimes.includes(user.uid);
          const yt = p.liens.map(idYoutube).filter(Boolean);
          return (
            <article key={p.id} className="card space-y-3 p-4">
              {p.statut === "en_attente" && (
                <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
                  <p className="font-semibold">En attente de validation par un administrateur</p>
                  {admin && (
                    <button onClick={() => valider(p)} className="btn-gold mt-3">
                      Valider et publier
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <Avatar nom={p.ownerNom} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.ownerNom}</p>
                  <p className="text-xs text-muted">{depuis(p.creeLe)}</p>
                </div>
              </div>
              {p.texte && <p className="whitespace-pre-line text-[15px]">{p.texte}</p>}
              {imgs.length > 0 && (
                <div className="flex snap-x gap-2 overflow-x-auto">
                  {imgs.map((src, k) => (
                    <button key={k} type="button" onClick={() => setZoom(src)} className={`flex-none snap-center ${imgs.length === 1 ? "w-full" : "w-[80%]"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="max-h-80 w-full rounded-2xl object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {yt.map((v) => (
                <div key={v} className="overflow-hidden rounded-2xl">
                  <iframe src={`https://www.youtube-nocookie.com/embed/${v}`} title="Vidéo YouTube" className="aspect-video w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              ))}
              {p.liens.length > 0 && (
                <div className="divide-y divide-line rounded-2xl border border-line">
                  {p.liens.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-3 py-2.5">
                      <ExternalLink size={16} className="text-gold-600" />
                      <span className="flex-1 text-sm font-semibold">Ouvrir sur {plateforme(u)}</span>
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 pt-1 text-sm">
                <button onClick={() => aimer(p)} disabled={p.statut !== "valide"} className={`flex items-center gap-1.5 font-semibold ${aime ? "text-brand-red" : "text-muted"}`}>
                  <Heart size={18} className={aime ? "fill-brand-red" : ""} /> {p.aimes.length > 0 ? p.aimes.length : "J’aime"}
                </button>
                <span className="flex-1" />
                {p.ownerUid !== user?.uid && <SignalerBouton cibleType="annonce" cibleId={p.id} cibleNom={`Publication de ${p.ownerNom}`} cibleUid={p.ownerUid} libelle="Signaler" className="text-xs" />}
                {(admin || p.ownerUid === user?.uid) && (
                  <button onClick={() => supprimer(p)} aria-label="Supprimer la publication" className="text-muted">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {posts && posts.length >= nb && (
        <button onClick={() => setNb(nb + PAR_PAGE)} className="btn-outline mt-4 w-full">
          Voir plus anciennes
        </button>
      )}
      <p className="mt-4 text-xs text-muted">Les publications sont modérées. RRTE n’est pas responsable du contenu publié par les membres.</p>
      {zoom && (
        <div onClick={() => setZoom("")} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
