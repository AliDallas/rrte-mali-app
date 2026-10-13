"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { ChevronLeft, MessageCircle, Phone, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Voyage, dateFr, expire, resumeTarif, voyageDepuisDoc } from "@/lib/voyages";
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
          {expire(v) && <div className="rounded-xl bg-line p-3 text-sm text-muted">Ce vol est passé.</div>}
          <div className="card space-y-3 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Tarif</p>
              <p className="font-display text-xl font-bold">{resumeTarif(v)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted">Date du vol</p>
                <p className="font-semibold">{dateFr(v.dateVol)}</p>
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

          <p className="text-xs text-muted">
            RRTE met les membres en relation sans être responsable du transport. Ne prenez jamais un colis fermé dont vous ignorez le contenu, et
            convenez clairement du prix et de la remise à l’arrivée.
          </p>

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
