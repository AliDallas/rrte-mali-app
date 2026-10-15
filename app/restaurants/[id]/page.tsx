"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDoc, getDocs, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { CalendarCheck, ChevronLeft, Clock, ExternalLink, MapPin, MessageCircle, Pencil, Phone, Star, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Etoiles from "@/components/Etoiles";
import SignalerBouton from "@/components/SignalerBouton";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { AvisResto, CATEGORIES_MENU, Plat, Resto, lirePhotosResto, moyenneResto, prixFcfa, restoDepuisDoc } from "@/lib/restaurants";
import { idYoutube, plateforme } from "@/lib/liens";
import { chiffres } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

export default function RestoDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [r, setR] = useState<Resto | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [avis, setAvis] = useState<AvisResto[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [note, setNote] = useState(0);
  const [comm, setComm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [zoom, setZoom] = useState("");

  const charger = useCallback(async () => {
    if (!id) return;
    const s = await getDoc(doc(db, "restos", id));
    if (!s.exists()) return setState("absent");
    setR(restoDepuisDoc(s.id, s.data()));
    const rs = await getDocs(collection(db, "restos", id, "avis"));
    const liste = rs.docs.map((d) => d.data() as AvisResto);
    setAvis(liste);
    const mien = liste.find((a) => a.uid === user?.uid);
    if (mien) {
      setNote(mien.note);
      setComm(mien.commentaire);
    }
    setState("ok");
    lirePhotosResto(id).then(setPhotos);
  }, [id, user]);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    charger().catch(() => setState("absent"));
  }, [profile, charger]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !id || note < 1) return;
    setSaving(true);
    setErr("");
    try {
      const rref = doc(db, "restos", id);
      const aref = doc(db, "restos", id, "avis", user.uid);
      await runTransaction(db, async (tx) => {
        const [rs, as] = await Promise.all([tx.get(rref), tx.get(aref)]);
        const d = rs.data() ?? {};
        const ancien = as.exists() ? (as.data().note as number) : 0;
        tx.set(aref, {
          uid: user.uid,
          auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
          note,
          commentaire: comm.trim(),
          createdAt: serverTimestamp(),
        });
        tx.update(rref, {
          nbAvis: (typeof d.nbAvis === "number" ? d.nbAvis : 0) + (as.exists() ? 0 : 1),
          sommeNotes: (typeof d.sommeNotes === "number" ? d.sommeNotes : 0) - ancien + note,
        });
      });
      viderCache("restos");
      await charger();
    } catch {
      setErr("Impossible d’enregistrer votre avis. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "restos", id), { statut: "valide" });
    viderCache("restos");
    await charger();
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "restos", id));
    viderCache("restos");
    router.push("/restaurants");
  }

  const estProprio = !!r && r.ownerUid === user?.uid;
  const peutGerer = !!r && (profile?.role === "admin" || estProprio);

  const parCategorie: [string, Plat[]][] = [];
  if (r) {
    const cats = [...CATEGORIES_MENU, ...r.menu.map((p) => p.cat).filter((c) => c && !CATEGORIES_MENU.includes(c))];
    Array.from(new Set(cats)).forEach((c) => {
      const items = r.menu.filter((p) => (p.cat || "Plats") === c);
      if (items.length) parCategorie.push([c, items]);
    });
  }
  const msgResa = r ? encodeURIComponent(`Bonjour, je vous contacte via l’application RRTE pour réserver une table chez ${r.nom}. Date et heure : … Nombre de personnes : …`) : "";

  return (
    <AppShell title={r?.nom || "Restaurant"} subtitle={r?.cuisine || "Restaurants"}>
      <Link href="/restaurants" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Restaurants
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable ou supprimée.</p>}
      {state === "ok" && r && (
        <div className="space-y-4">
          {r.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {profile?.role === "admin" && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette fiche
                </button>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="flex snap-x gap-2 overflow-x-auto">
              {photos.map((p, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={p} alt="" className="h-56 w-[88%] flex-none snap-center rounded-2xl object-cover" />
              ))}
            </div>
          )}

          <div className="card space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Etoiles note={moyenneResto(r)} size={18} />
              <span className="text-sm text-muted">{r.nbAvis > 0 ? `${moyenneResto(r).toFixed(1)} · ${r.nbAvis} avis` : "Pas encore noté"}</span>
            </div>
            {r.description && <p className="whitespace-pre-line text-[15px]">{r.description}</p>}
            {r.platDuJour && (
              <div className="rounded-xl bg-brand-red/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">Plat du jour</p>
                <p className="font-semibold">{r.platDuJour}</p>
              </div>
            )}
            {r.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {r.services.map((s) => (
                  <span key={s} className="rounded-full bg-gold-100 px-2.5 py-1 text-xs text-gold-700">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-1.5 text-sm text-muted">
              {(r.quartier || r.adresse) && (
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 flex-none text-gold-600" /> {[r.adresse, r.quartier, r.ville].filter(Boolean).join(", ")}
                </p>
              )}
              {r.horaires && (
                <p className="flex items-start gap-2">
                  <Clock size={16} className="mt-0.5 flex-none text-gold-600" /> {r.horaires}
                </p>
              )}
            </div>
            <p className="text-xs font-semibold text-gold-700">Proposé par {r.ownerNom}</p>
          </div>

          {r.tel && (
            <div className="card space-y-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="flex-1 text-[15px]">{r.tel}</span>
                <a href={`tel:${r.tel}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${chiffres(r.tel)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
                >
                  <MessageCircle size={17} />
                </a>
              </div>
              <a
                href={`https://wa.me/${chiffres(r.tel)}?text=${msgResa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-ink-fg"
              >
                <CalendarCheck size={16} /> Réserver une table sur WhatsApp
              </a>
            </div>
          )}

          {parCategorie.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Menu</h2>
              {parCategorie.map(([cat, plats]) => (
                <div key={cat} className="card divide-y divide-line">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gold-700">{cat}</p>
                  {plats.map((p, k) => (
                    <div key={k} className="flex items-start justify-between gap-3 px-4 py-3">
                      {p.photo && (
                        <button type="button" onClick={() => setZoom(p.photo)} aria-label={`Agrandir la photo de ${p.nom}`} className="flex-none">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{p.nom}</p>
                        {p.desc && <p className="text-sm text-muted">{p.desc}</p>}
                      </div>
                      {p.prix > 0 && <p className="flex-none text-sm font-semibold">{prixFcfa(p.prix)}</p>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {r.liens.map(idYoutube).filter(Boolean).map((v) => (
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
          {r.liens.length > 0 && (
            <div className="card divide-y divide-line">
              {r.liens.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3">
                  <ExternalLink size={17} className="text-gold-600" />
                  <span className="flex-1 text-[15px] font-semibold">Ouvrir sur {plateforme(u)}</span>
                </a>
              ))}
            </div>
          )}

          {!estProprio && (
            <form onSubmit={envoyer} className="card space-y-3 p-5">
              <p className="font-semibold">{avis.some((a) => a.uid === user?.uid) ? "Modifier mon avis" : "Donner mon avis"}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button type="button" key={i} onClick={() => setNote(i)} aria-label={`${i} sur 5`}>
                    <Star size={30} strokeWidth={1.5} className={i <= note ? "fill-gold-500 text-gold-500" : "text-line"} />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={comm}
                onChange={(e) => setComm(e.target.value)}
                placeholder="Votre expérience (cuisine, accueil, prix, service…)"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              {err && <p className="text-sm text-brand-red">{err}</p>}
              <button type="submit" disabled={saving || note < 1} className="btn-gold">
                {saving ? "Envoi..." : "Publier mon avis"}
              </button>
              <p className="text-xs text-muted">Un avis honnête, fondé sur une expérience réelle.</p>
            </form>
          )}

          {avis.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Avis des membres</h2>
              {avis.map((a) => (
                <div key={a.uid} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{a.auteurNom}</p>
                    <Etoiles note={a.note} size={14} />
                  </div>
                  {a.commentaire && <p className="mt-1.5 whitespace-pre-line text-[15px]">{a.commentaire}</p>}
                  {a.uid !== user?.uid && (
                    <div className="mt-1">
                      <SignalerBouton cibleType="reponse" cibleId={`${r.id}_${a.uid}`} cibleNom={`Avis de ${a.auteurNom} sur ${r.nom}`} cibleUid={a.uid} libelle="Signaler cet avis" className="text-xs" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted">RRTE met les membres en relation et n’est pas responsable des services rendus par les restaurants.</p>

          <div className="flex justify-center">
            <SignalerBouton cibleType="fiche" cibleId={r.id} cibleNom={`Restaurant « ${r.nom} »`} cibleUid={r.ownerUid} libelle="Signaler cette fiche" />
          </div>

          {peutGerer && (
            <Link href={`/restaurants/${r.id}/modifier`} className="btn-outline flex items-center justify-center gap-2">
              <Pencil size={15} /> Modifier ma fiche et mon menu
            </Link>
          )}
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
                <Trash2 size={15} /> Supprimer la fiche
              </button>
            ))}
        </div>
      )}
      {zoom && (
        <div onClick={() => setZoom("")} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
