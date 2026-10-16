"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { Building2, CalendarDays, ChevronLeft, ExternalLink, HeartHandshake, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import ChangerAdministrateur from "@/components/ChangerAdministrateur";
import PublicationForm from "@/components/PublicationForm";
import SignalerBouton from "@/components/SignalerBouton";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  AVERTISSEMENT_DONS,
  Publication,
  Structure,
  dateFr,
  libelleTypePublication,
  lirePhotosStructure,
  publicationDepuisDoc,
  structureDepuisDoc,
} from "@/lib/solidarite";
import { plateforme } from "@/lib/liens";
import { chiffres } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

export default function StructureDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [s, setS] = useState<Structure | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [ajout, setAjout] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [zoom, setZoom] = useState("");

  const charger = useCallback(async () => {
    if (!id) return;
    const d = await getDoc(doc(db, "structures", id));
    if (!d.exists()) return setState("absent");
    setS(structureDepuisDoc(d.id, d.data()));
    setState("ok");
    lirePhotosStructure(id).then(setPhotos);
    getDocs(collection(db, "structures", id, "publications"))
      .then((r) => setPubs(r.docs.map((x) => publicationDepuisDoc(x.id, x.data())).sort((a, b) => b.creeLe - a.creeLe)))
      .catch(() => setPubs([]));
  }, [id]);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    charger().catch(() => setState("absent"));
  }, [profile, charger]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "structures", id), { statut: "valide" });
    viderCache("structures");
    await charger();
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "structures", id));
    viderCache("structures");
    router.push("/solidarite");
  }

  async function supprimerPub(pid: string) {
    if (!id) return;
    await deleteDoc(doc(db, "structures", id, "publications", pid));
    setPubs((l) => l.filter((p) => p.id !== pid));
  }

  const estAdminPage = !!s && s.ownerUid === user?.uid;
  const estAdminRRTE = profile?.role === "admin";
  const peutGerer = estAdminPage || estAdminRRTE;
  const peutPublier = peutGerer && s?.statut === "valide";
  const routeListe = s?.type === "collectif" ? "collectifs" : "associations";
  const Icone = s?.type === "collectif" ? Users : Building2;
  const tel = s ? chiffres(s.contact) : "";

  return (
    <AppShell title={s?.nom || "Entraide & solidarité"} subtitle={s ? `${s.type === "collectif" ? "Collectif" : "Association"} · ${s.categorie}` : "Entraide & solidarité"}>
      <Link href={`/solidarite/${routeListe}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> {s?.type === "collectif" ? "Collectifs" : "Associations"}
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Page introuvable ou supprimée.</p>}
      {state === "ok" && s && (
        <div className="space-y-4">
          {s.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur RRTE</p>
              {estAdminRRTE && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette page
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
            <div className="flex items-center gap-2 text-sm text-muted">
              <Icone size={16} /> {s.type === "collectif" ? "Collectif" : "Association"} · administrateur : {s.ownerNom}
            </div>
            {s.ville && (
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> {s.ville}
              </p>
            )}
            <p className="whitespace-pre-line text-[15px]">{s.description}</p>
            {s.contact && (
              <div className="flex gap-2">
                <a href={`tel:${s.contact}`} className="btn-outline flex flex-1 items-center justify-center gap-2">
                  <Phone size={16} /> Appeler
                </a>
                {tel && (
                  <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="btn-outline flex flex-1 items-center justify-center gap-2">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>
            )}
            {s.liens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {s.liens.map((l) => (
                  <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium">
                    <ExternalLink size={13} /> {plateforme(l) === "Lien" ? "Site" : plateforme(l)}
                  </a>
                ))}
              </div>
            )}
          </div>

          {(s.liensDon.length > 0 || s.infosDon) && (
            <div className="card space-y-3 border-2 border-gold-500 p-5">
              <p className="flex items-center gap-2 font-display font-bold">
                <HeartHandshake size={18} className="text-gold-700" /> Soutenir
              </p>
              {s.liensDon.map((d) => (
                <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center justify-center gap-2">
                  <ExternalLink size={15} /> {d.libelle}
                </a>
              ))}
              {s.infosDon && <p className="whitespace-pre-line text-sm">{s.infosDon}</p>}
              <p className="text-xs text-muted">{AVERTISSEMENT_DONS}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Publications</h2>
              {peutPublier && (
                <button onClick={() => setAjout(!ajout)} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
                  <Plus size={15} /> Publier
                </button>
              )}
            </div>
            {ajout && peutPublier && (
              <PublicationForm
                structureId={s.id}
                onDone={() => {
                  setAjout(false);
                  charger();
                }}
              />
            )}
            {pubs.length === 0 && !ajout && <p className="card p-5 text-center text-sm text-muted">Aucune publication pour le moment.</p>}
            {pubs.map((p) => (
              <article key={p.id} className="card space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-semibold text-gold-700">{libelleTypePublication(p.type)}</span>
                  {p.date && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <CalendarDays size={12} /> {dateFr(p.date)}
                    </span>
                  )}
                </div>
                <p className="font-display font-bold">{p.titre}</p>
                {p.lieu && (
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={12} /> {p.lieu}
                  </p>
                )}
                {p.texte && <p className="whitespace-pre-line text-[15px]">{p.texte}</p>}
                {p.affiche && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.affiche} alt="" onClick={() => setZoom(p.affiche)} className="max-h-96 w-full cursor-zoom-in rounded-xl object-contain" />
                )}
                {p.liens.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.liens.map((l) => (
                      <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium">
                        <ExternalLink size={13} /> {plateforme(l) === "Lien" ? "Voir le lien" : plateforme(l)}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  {!peutGerer && (
                    <SignalerBouton cibleType="annonce" cibleId={`${s.id}_${p.id}`} cibleNom={`Publication « ${p.titre} » de ${s.nom}`} cibleUid={s.ownerUid} libelle="Signaler" className="text-xs" />
                  )}
                  {peutGerer && (
                    <button onClick={() => supprimerPub(p.id)} className="flex items-center gap-1 text-xs text-brand-red">
                      <Trash2 size={13} /> Supprimer
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {!estAdminPage && <SignalerBouton cibleType="fiche" cibleId={s.id} cibleNom={`${s.type === "collectif" ? "Collectif" : "Association"} « ${s.nom} »`} cibleUid={s.ownerUid} libelle="Signaler cette page" />}

          {peutGerer && (
            <div className="space-y-2">
              <Link href={`/solidarite/structure/${s.id}/modifier`} className="btn-outline flex items-center justify-center gap-2">
                <Pencil size={16} /> Modifier ma page
              </Link>
              {estAdminRRTE && <ChangerAdministrateur structureId={s.id} adminActuel={s.ownerNom} onDone={charger} />}
              {confirm ? (
                <div className="card space-y-2 p-4 text-sm">
                  <p>Supprimer définitivement cette page ?</p>
                  <div className="flex gap-2">
                    <button onClick={supprimer} className="btn-gold flex-1">
                      Oui, supprimer
                    </button>
                    <button onClick={() => setConfirm(false)} className="btn-outline flex-1">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirm(true)} className="flex w-full items-center justify-center gap-2 text-sm text-brand-red">
                  <Trash2 size={15} /> Supprimer la page
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setZoom("")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
