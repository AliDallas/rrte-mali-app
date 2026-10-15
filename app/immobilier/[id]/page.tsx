"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, ExternalLink, MapPin, MessageCircle, Phone, ShieldAlert, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Immo, immoDepuisDoc, libelleTermine, libelleTypeImmo, lirePhotosImmo, resumePrix } from "@/lib/immobilier";
import { chiffres } from "@/lib/fiches";
import { idYoutube, plateforme } from "@/lib/liens";
import { viderCache } from "@/lib/cache";

export default function ImmoDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [i, setI] = useState<Immo | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "immobilier", id))
      .then((s) => {
        if (!s.exists()) return setState("absent");
        setI(immoDepuisDoc(s.id, s.data()));
        setState("ok");
        lirePhotosImmo(id).then(setPhotos);
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "immobilier", id), { statut: "valide" });
    viderCache("immobilier");
    setI((x) => (x ? { ...x, statut: "valide" } : x));
  }

  async function basculerTermine() {
    if (!id || !i) return;
    await updateDoc(doc(db, "immobilier", id), { termine: !i.termine });
    viderCache("immobilier");
    setI({ ...i, termine: !i.termine });
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "immobilier", id));
    viderCache("immobilier");
    router.push("/immobilier");
  }

  const peutGerer = !!i && (profile?.role === "admin" || i.ownerUid === user?.uid);
  const sensible = i?.typeAnnonce === "vente" || i?.bien === "Terrain / parcelle";

  return (
    <AppShell title={i?.titre || "Annonce"} subtitle={i ? libelleTypeImmo(i.typeAnnonce) : "Immobilier"}>
      <Link href="/immobilier" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Immobilier
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Annonce introuvable ou supprimée.</p>}
      {state === "ok" && i && (
        <div className="space-y-4">
          {i.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {profile?.role === "admin" && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette annonce
                </button>
              )}
            </div>
          )}
          {i.termine && <div className="rounded-xl bg-line p-3 text-sm text-muted">Annonce terminée : {libelleTermine(i.typeAnnonce).toLowerCase()}.</div>}

          {photos.length > 0 && (
            <div className="flex snap-x gap-2 overflow-x-auto">
              {photos.map((p, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={k} src={p} alt="" className="h-60 w-[88%] flex-none snap-center rounded-2xl object-cover" />
              ))}
            </div>
          )}

          <div className="card space-y-3 p-5">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#1B7F76]/10 px-3 py-1 text-xs font-semibold text-[#1B7F76]">{libelleTypeImmo(i.typeAnnonce)}</span>
              {i.bien && <span className="rounded-full bg-line px-3 py-1 text-xs text-muted">{i.bien}</span>}
              {i.meuble && <span className="rounded-full bg-line px-3 py-1 text-xs text-muted">{i.meuble === "meuble" ? "Meublé" : "Non meublé"}</span>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{i.typeAnnonce === "recherche" ? "Budget" : "Prix"}</p>
              <p className="font-display text-xl font-bold">{resumePrix(i)}</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <MapPin size={16} className="text-gold-600" /> {[i.quartier, i.ville].filter(Boolean).join(", ")}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {i.surface > 0 && (
                <div>
                  <p className="text-xs text-muted">Surface</p>
                  <p className="font-semibold">{i.surface} m²</p>
                </div>
              )}
              {i.pieces > 0 && (
                <div>
                  <p className="text-xs text-muted">Pièces / chambres</p>
                  <p className="font-semibold">{i.pieces}</p>
                </div>
              )}
              {i.disponibleLe && (
                <div className="col-span-2">
                  <p className="text-xs text-muted">Disponible</p>
                  <p className="font-semibold">{i.disponibleLe}</p>
                </div>
              )}
            </div>
            {i.equipements.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted">Équipements</p>
                <div className="flex flex-wrap gap-1.5">
                  {i.equipements.map((e) => (
                    <span key={e} className="rounded-full bg-gold-100 px-2.5 py-1 text-xs text-gold-700">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {i.papiers.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted">Papiers indiqués par le vendeur</p>
                <ul className="list-disc pl-5 text-sm">
                  {i.papiers.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {i.description && <p className="whitespace-pre-line text-[15px]">{i.description}</p>}
            <p className="text-xs font-semibold text-gold-700">Publié par {i.ownerNom}</p>
          </div>

          {i.liens.map(idYoutube).filter(Boolean).map((v) => (
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

          {i.liens.length > 0 && (
            <div className="card divide-y divide-line">
              {i.liens.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3">
                  <ExternalLink size={17} className="text-gold-600" />
                  <span className="flex-1 text-[15px] font-semibold">Ouvrir sur {plateforme(u)}</span>
                </a>
              ))}
            </div>
          )}

          {i.tel && (
            <div className="card flex items-center gap-3 px-4 py-3">
              <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
              <span className="flex-1 text-[15px]">{i.tel}</span>
              <a href={`tel:${i.tel}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                Appeler
              </a>
              <a
                href={`https://wa.me/${chiffres(i.tel)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          )}

          <div className="rounded-2xl bg-gold-100 p-4 text-sm text-gold-700">
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <ShieldAlert size={16} /> Avant de vous engager
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Visitez le bien en personne ou par une personne de confiance.</li>
              <li>Ne versez aucun argent avant d’avoir visité et vérifié les papiers.</li>
              {sensible && (
                <li>
                  Pour une vente ou un terrain : faites vérifier le titre et l’historique du bien par un notaire ou les services fonciers compétents. Plusieurs
                  personnes peuvent prétendre vendre le même terrain.
                </li>
              )}
              <li>RRTE met les membres en relation mais n’est pas partie à la transaction et n’en est pas responsable.</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <SignalerBouton cibleType="annonce" cibleId={i.id} cibleNom={`Annonce immobilière de ${i.ownerNom}`} cibleUid={i.ownerUid} libelle="Signaler cette annonce" />
          </div>

          {peutGerer && (
            <button onClick={basculerTermine} className="btn-outline w-full">
              {i.termine ? "Remettre l’annonce en ligne" : `Marquer comme ${libelleTermine(i.typeAnnonce).toLowerCase()}`}
            </button>
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
                <Trash2 size={15} /> Supprimer l’annonce
              </button>
            ))}
        </div>
      )}
    </AppShell>
  );
}
