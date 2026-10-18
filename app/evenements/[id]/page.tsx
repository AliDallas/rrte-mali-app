"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { QueryDocumentSnapshot, arrayRemove, arrayUnion, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Clock, ExternalLink, ImagePlus, X, MapPin, MessageCircle, Phone, Trash2, Users, Wallet } from "lucide-react";
import AppShell from "@/components/AppShell";
import SignalerBouton from "@/components/SignalerBouton";
import Covoiturage from "@/components/Covoiturage";
import Sondages from "@/components/Sondages";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EventItem, MAX_PHOTOS_GALERIE, PhotoGalerie, ajouterPhotoGalerie, eventDepuisDoc, isUpcoming, compterGalerie, lireGalerie, lirePhotosEvent, longDate } from "@/lib/events";
import { reduireImage } from "@/lib/image";
import { chiffres } from "@/lib/fiches";
import { idYoutube, plateforme } from "@/lib/liens";

export default function EvenementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [ev, setEv] = useState<EventItem | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [galerie, setGalerie] = useState<PhotoGalerie[]>([]);
  const [dernier, setDernier] = useState<QueryDocumentSnapshot | undefined>();
  const [finGalerie, setFinGalerie] = useState(true);
  const [voir, setVoir] = useState<string | null>(null);
  const [envoiPhotos, setEnvoiPhotos] = useState("");
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [messagePhotos, setMessagePhotos] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "events", id))
      .then((snap) => {
        if (!snap.exists()) return setState("absent");
        setEv(eventDepuisDoc(snap.id, snap.data()));
        setState("ok");
        lirePhotosEvent(id).then(setPhotos);
        compterGalerie(id).then(setTotalPhotos).catch(() => undefined);
        lireGalerie(id)
          .then((g) => {
            setGalerie(g.photos);
            setDernier(g.dernier);
            setFinGalerie(g.fini);
          })
          .catch(() => undefined);
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  async function toggle() {
    if (!ev || !user) return;
    const going = ev.attendees.includes(user.uid);
    setBusy(true);
    try {
      await updateDoc(doc(db, "events", ev.id), { attendees: going ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      setEv({ ...ev, attendees: going ? ev.attendees.filter((u) => u !== user.uid) : [...ev.attendees, user.uid] });
    } finally {
      setBusy(false);
    }
  }

  async function plusDePhotos() {
    if (!id || !dernier) return;
    const g = await lireGalerie(id, dernier);
    setGalerie((x) => [...x, ...g.photos]);
    setDernier(g.dernier ?? dernier);
    setFinGalerie(g.fini);
  }

  async function ajouterPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    let fichiers = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!id || !user || !profile || fichiers.length === 0) return;
    setMessagePhotos("");
    const reste = Math.max(0, MAX_PHOTOS_GALERIE - totalPhotos);
    if (fichiers.length > reste) {
      setMessagePhotos(reste === 0 ? `La galerie est pleine (${MAX_PHOTOS_GALERIE} photos).` : `Seules ${reste} photo${reste > 1 ? "s" : ""} ont pu être ajoutée${reste > 1 ? "s" : ""} (limite de ${MAX_PHOTOS_GALERIE}).`);
      fichiers = fichiers.slice(0, reste);
    }
    if (fichiers.length === 0) return;
    const base = Date.now();
    const ajoutees: PhotoGalerie[] = [];
    const nom = `${profile.prenom} ${profile.nom}`.trim();
    try {
      for (let i = 0; i < fichiers.length; i++) {
        setEnvoiPhotos(`Envoi : ${i + 1} / ${fichiers.length}`);
        const data = await reduireImage(fichiers[i], 720, 0.65);
        const pid = await ajouterPhotoGalerie(id, data, base + i, user.uid, nom);
        ajoutees.push({ id: pid, data, auteurUid: user.uid, auteurNom: nom });
      }
    } catch {
      setMessagePhotos("Une photo n’a pas pu être envoyée. Réessayez.");
    } finally {
      setEnvoiPhotos("");
      setGalerie((x) => [...x, ...ajoutees]);
      setTotalPhotos((n) => n + ajoutees.length);
    }
  }

  async function retirerPhoto(pid: string) {
    if (!id) return;
    await deleteDoc(doc(db, "events", id, "medias", pid));
    setGalerie((x) => x.filter((p) => p.id !== pid));
    setTotalPhotos((n) => Math.max(0, n - 1));
    setVoir(null);
  }

  async function valider() {
    if (!ev) return;
    await updateDoc(doc(db, "events", ev.id), { statut: "valide" });
    setEv({ ...ev, statut: "valide" });
  }

  async function remove() {
    if (!ev) return;
    await deleteDoc(doc(db, "events", ev.id));
    router.push("/evenements");
  }

  const going = !!(ev && user && ev.attendees.includes(user.uid));
  const membres = ev?.categorie === "membres";
  const passe = !!ev && !isUpcoming(ev.date);
  const peutAjouter = !!ev && ev.statut !== "en_attente" && (isAdmin || passe);
  const photoOuverte = galerie.find((p) => p.id === voir);
  const peutSupprimer = !!ev && (isAdmin || ev.created_by === user?.uid);
  const videos = (ev?.liens ?? []).map(idYoutube).filter(Boolean);

  return (
    <AppShell title={ev?.titre ?? "Événement"} subtitle={ev ? longDate(ev.date) : undefined}>
      <Link href="/evenements" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Événements
      </Link>

      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Événement introuvable.</p>}

      {ev && state === "ok" && (
        <div className="space-y-4">
          {ev.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {isAdmin && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cet événement
                </button>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className={`flex snap-x items-start gap-2 overflow-x-auto ${photos.length === 1 ? "justify-center" : ""}`}>
              {photos.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt="" className="h-auto max-h-[75vh] w-auto max-w-full flex-none snap-center rounded-2xl object-contain" style={{ maxWidth: photos.length === 1 ? "100%" : "88%" }} />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${membres ? "bg-[#5B3190] text-white" : "bg-ink text-gold-400"}`}>
              {membres ? "Entre membres" : "Événement RRTE"}
            </span>
            {ev.typeEvenement && <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">{ev.typeEvenement}</span>}
          </div>

          <div className="card divide-y divide-line">
            {ev.heure && (
              <div className="flex items-center gap-3 p-4">
                <Clock size={20} className="text-gold-700" strokeWidth={1.75} /> À partir de {ev.heure}
              </div>
            )}
            {ev.lieu && (
              <div className="flex items-center gap-3 p-4">
                <MapPin size={20} className="text-gold-700" strokeWidth={1.75} /> {ev.lieu}
              </div>
            )}
            {ev.participation && (
              <div className="flex items-center gap-3 p-4">
                <Wallet size={20} className="text-gold-700" strokeWidth={1.75} /> {ev.participation}
              </div>
            )}
            {isUpcoming(ev.date) && (
              <div className="flex items-center gap-3 p-4">
                <Users size={20} className="text-gold-700" strokeWidth={1.75} /> {ev.attendees.length} inscrit{ev.attendees.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {ev.description && (
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{membres ? "Détails" : "Programme"}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{ev.description}</p>
            </div>
          )}

          {membres && ev.organisateurNom && (
            <p className="text-sm font-semibold text-gold-700">
              Organisé par {ev.organisateurNom}
              {ev.organisateurType === "association" ? " (association)" : ""}
            </p>
          )}

          {videos.map((v) => (
            <div key={v} className="overflow-hidden rounded-2xl">
              <iframe src={`https://www.youtube-nocookie.com/embed/${v}`} title="Vidéo YouTube" className="aspect-video w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
            </div>
          ))}

          {ev.liens.length > 0 && (
            <div className="card divide-y divide-line">
              {ev.liens.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3">
                  <ExternalLink size={17} className="text-gold-600" />
                  <span className="flex-1 text-[15px] font-semibold">Ouvrir sur {plateforme(u)}</span>
                </a>
              ))}
            </div>
          )}

          {(galerie.length > 0 || peutAjouter) && (
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Photos de l’événement</h2>
              {galerie.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {galerie.map((p) => (
                    <button key={p.id} onClick={() => setVoir(p.id)} className="aspect-square overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.data} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {!finGalerie && (
                <button onClick={plusDePhotos} className="btn-outline mt-3 !text-ink">
                  Voir plus de photos
                </button>
              )}
              {peutAjouter && totalPhotos < MAX_PHOTOS_GALERIE && (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-gold-500 bg-gold-100/40 px-4 py-3 text-sm font-semibold text-gold-700">
                  <ImagePlus size={18} /> {envoiPhotos || "Ajouter mes photos (plusieurs à la fois)"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} disabled={!!envoiPhotos} />
                </label>
              )}
              {peutAjouter && (
                <p className="mt-2 text-xs text-muted">
                  {totalPhotos} / {MAX_PHOTOS_GALERIE} photos. Photos uniquement, pas de vidéo.
                  {messagePhotos && <span className="block font-semibold text-brand-red">{messagePhotos}</span>}
                </p>
              )}
            </div>
          )}

          {voir && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setVoir(null)}>
              <button aria-label="Fermer" className="absolute right-4 top-4 text-white" onClick={() => setVoir(null)}>
                <X size={28} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoOuverte?.data} alt="" className="max-h-[75vh] max-w-full rounded-xl object-contain" />
              {photoOuverte?.auteurNom && <p className="mt-3 text-sm text-white/70">Photo ajoutée par {photoOuverte.auteurNom}</p>}
              <div className="mt-3 flex items-center gap-6 text-white/80" onClick={(e) => e.stopPropagation()}>
                {(isAdmin || (!!photoOuverte && photoOuverte.auteurUid === user?.uid)) && (
                  <button onClick={() => retirerPhoto(voir)} className="flex items-center gap-2 text-sm">
                    <Trash2 size={15} /> Retirer cette photo
                  </button>
                )}
                {photoOuverte && photoOuverte.auteurUid && photoOuverte.auteurUid !== user?.uid && (
                  <span className="text-white">
                    <SignalerBouton cibleType="annonce" cibleId={`${ev.id}_${photoOuverte.id}`} cibleNom={`Photo de ${photoOuverte.auteurNom} (événement « ${ev.titre} »)`} cibleUid={photoOuverte.auteurUid} libelle="Signaler" className="!text-white/80" />
                  </span>
                )}
              </div>
            </div>
          )}

          {ev.contact && (
            <div className="card flex items-center gap-3 px-4 py-3">
              <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
              <span className="flex-1 text-[15px]">{ev.contact}</span>
              <a href={`tel:${ev.contact}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                Appeler
              </a>
              <a href={`https://wa.me/${chiffres(ev.contact)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink">
                <MessageCircle size={17} />
              </a>
            </div>
          )}

          {isUpcoming(ev.date) && ev.statut !== "en_attente" && (
            <button
              disabled={busy}
              onClick={toggle}
              className={going ? "flex w-full items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 font-semibold text-muted" : "btn-gold"}
            >
              {going ? "Je ne viens plus" : "Je m’inscris"}
            </button>
          )}

          {ev.statut !== "en_attente" && <Sondages eventId={ev.id} peutCreer={isAdmin || ev.created_by === user?.uid} />}

          {ev.statut !== "en_attente" && (isUpcoming(ev.date) || ev.covoiturage) && (
            <Covoiturage eventId={ev.id} titre={ev.titre} actif={ev.covoiturage} onActive={(v) => setEv({ ...ev, covoiturage: v })} />
          )}

          {membres && (
            <div className="flex justify-center">
              <SignalerBouton cibleType="annonce" cibleId={ev.id} cibleNom={`Événement « ${ev.titre} »`} cibleUid={ev.created_by} libelle="Signaler cet événement" />
            </div>
          )}

          {peutSupprimer && (
            <div className="pt-2">
              {confirmDelete ? (
                <div className="flex gap-3">
                  <button onClick={remove} className="flex-1 rounded-full bg-brand-red px-4 py-3 font-semibold text-white">
                    Confirmer la suppression
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-full border border-line bg-white px-4 py-3 text-muted">
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 text-sm text-muted">
                  <Trash2 size={16} /> Supprimer l’événement
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
