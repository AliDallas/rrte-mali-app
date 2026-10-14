"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, MessageCircle, Phone, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Voyage, dateFr, expire, libelleType, resumeTarif, voyageDepuisDoc } from "@/lib/voyages";
import { chiffres } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

export default function VoyageDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [v, setV] = useState<Voyage | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "voyages", id))
      .then((s) => {
        if (!s.exists()) return setState("absent");
        setV(voyageDepuisDoc(s.id, s.data()));
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "voyages", id), { statut: "valide" });
    viderCache("voyages");
    setV((x) => (x ? { ...x, statut: "valide" } : x));
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "voyages", id));
    viderCache("voyages");
    router.push("/voyages");
  }

  const peutGerer = !!v && (profile?.role === "admin" || v.ownerUid === user?.uid);

  return (
    <AppShell title={v ? `${v.depart} → ${v.arrivee}` : "Annonce"} subtitle={v ? `Vol le ${dateFr(v.dateVol)}` : "Voyageurs & bagages"}>
      <Link href="/voyages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Voyageurs & bagages
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Annonce introuvable ou supprimée.</p>}
      {state === "ok" && v && (
        <div className="space-y-4">
          {v.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {profile?.role === "admin" && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette annonce
                </button>
              )}
            </div>
          )}
          {expire(v) && <div className="rounded-xl bg-line p-3 text-sm text-muted">Ce voyage est passé.</div>}
          <div className="card space-y-3 p-5">
            <span className="inline-block rounded-full bg-[#5B3190]/10 px-3 py-1 text-xs font-semibold text-[#5B3190]">{libelleType(v.typeAnnonce)}</span>
            {v.typeAnnonce === "kilos" ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Tarif</p>
                <p className="font-display text-xl font-bold">{resumeTarif(v)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{v.typeAnnonce === "besoin" ? "Personne à accompagner" : "Je peux accompagner"}</p>
                <p className="font-display text-xl font-bold">
                  {v.personne}
                  {v.agePersonne && ` (${v.agePersonne})`}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">{v.typeAnnonce === "besoin" ? "Date du voyage" : "Date du vol"}</p>
                <p className="font-semibold">
                  {dateFr(v.dateVol)}
                  {v.dateSouple && <span className="block text-xs font-normal text-muted">dates flexibles de quelques jours</span>}
                </p>
              </div>
              {v.compagnie && (
                <div>
                  <p className="text-xs text-muted">Compagnie</p>
                  <p className="font-semibold">{v.compagnie}</p>
                </div>
              )}
              {v.kilosDispo > 0 && (
                <div>
                  <p className="text-xs text-muted">Kilos disponibles</p>
                  <p className="font-semibold">{v.kilosDispo} kg</p>
                </div>
              )}
              {v.dateLimite && (
                <div>
                  <p className="text-xs text-muted">Dépôt des colis avant le</p>
                  <p className="font-semibold text-brand-red">{dateFr(v.dateLimite)}</p>
                </div>
              )}
            </div>
            {v.message && (
              <div className="rounded-xl bg-gold-100 p-3">
                <p className="mb-1 text-xs font-semibold text-gold-700">Message du voyageur</p>
                <p className="whitespace-pre-line text-[15px]">{v.message}</p>
              </div>
            )}
            <p className="text-xs font-semibold text-gold-700">Proposé par {v.ownerNom}</p>
          </div>

          {v.tel && (
            <div className="card flex items-center gap-3 px-4 py-3">
              <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
              <span className="flex-1 text-[15px]">{v.tel}</span>
              <a href={`tel:${v.tel}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                Appeler
              </a>
              <a
                href={`https://wa.me/${chiffres(v.tel)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
              >
                <MessageCircle size={17} />
              </a>
            </div>
          )}

          {v.typeAnnonce === "kilos" ? (
            <p className="text-xs text-muted">
              RRTE met les membres en relation sans être responsable du transport. Ne prenez jamais un colis fermé dont vous ignorez le contenu, et
              convenez clairement du prix et de la remise à l’arrivée.
            </p>
          ) : (
            <div className="rounded-2xl bg-gold-100 p-4 text-sm text-gold-700">
              <p className="font-semibold">Voyager avec un enfant ou un parent qui n’est pas le vôtre</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>Pour un mineur, demandez d’abord à la compagnie son service pour enfants qui voyagent seuls et les documents exigés (autorisation des parents, pièces d’identité…).</li>
                <li>Parlez-vous avant le départ, échangez les pièces d’identité et sachez qui récupère la personne à l’arrivée.</li>
                <li>RRTE met les membres en relation mais n’est pas responsable de ces voyages.</li>
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <SignalerBouton cibleType="annonce" cibleId={v.id} cibleNom={`Annonce de ${v.ownerNom}`} cibleUid={v.ownerUid} libelle="Signaler cette annonce ou ce contenu" />
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
                <Trash2 size={15} /> Supprimer l’annonce
              </button>
            ))}
        </div>
      )}
    </AppShell>
  );
}
