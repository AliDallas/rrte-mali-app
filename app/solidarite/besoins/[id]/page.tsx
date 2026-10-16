"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronLeft, ExternalLink, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import SignalerBouton from "@/components/SignalerBouton";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { AVERTISSEMENT_DONS, Besoin, besoinDepuisDoc, dateFr, joursRestants, libelleDelai } from "@/lib/solidarite";
import { plateforme } from "@/lib/liens";
import { chiffres } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

export default function BesoinDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [b, setB] = useState<Besoin | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);
  const [zoom, setZoom] = useState(false);

  const charger = useCallback(async () => {
    if (!id) return;
    const d = await getDoc(doc(db, "besoins", id));
    if (!d.exists()) return setState("absent");
    setB(besoinDepuisDoc(d.id, d.data()));
    setState("ok");
  }, [id]);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    charger().catch(() => setState("absent"));
  }, [profile, charger]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "besoins", id), { statut: "valide" });
    viderCache("besoins");
    await charger();
  }

  async function basculerResolu() {
    if (!id || !b) return;
    await updateDoc(doc(db, "besoins", id), { resolu: !b.resolu });
    viderCache("besoins");
    await charger();
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "besoins", id));
    viderCache("besoins");
    router.push("/solidarite/besoins");
  }

  const estAdmin = profile?.role === "admin";
  const estAuteur = !!b && b.ownerUid === user?.uid;
  const j = b ? joursRestants(b.dateLimite) : null;
  const expire = j !== null && j < 0;
  const fini = !!b && (b.resolu || expire);
  const tel = b ? chiffres(b.contact) : "";

  return (
    <AppShell title={b?.titre || "Besoin"} subtitle={b?.type || "Besoins & urgences"}>
      <Link href="/solidarite/besoins" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Besoins & urgences
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Besoin introuvable ou supprimé.</p>}
      {state === "ok" && b && (
        <div className="space-y-4">
          {b.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {estAdmin && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier ce besoin
                </button>
              )}
            </div>
          )}

          <div className={`card space-y-3 p-5 ${b.urgent && !fini ? "border-2 border-brand-red" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              {b.urgent && !fini && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-red px-2 py-0.5 text-xs font-bold text-white">
                  <AlertTriangle size={11} /> URGENT
                </span>
              )}
              {b.resolu && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  <CheckCircle2 size={11} /> TERMINÉ
                </span>
              )}
              {!b.resolu && expire && <span className="rounded-full bg-muted/30 px-2 py-0.5 text-xs font-bold">EXPIRÉ</span>}
            </div>
            <p className="flex items-center gap-2 font-semibold">
              <CalendarClock size={18} className={fini ? "text-muted" : "text-brand-red"} />
              {b.resolu ? "Besoin terminé" : libelleDelai(b.dateLimite)} · date limite {dateFr(b.dateLimite)}
            </p>
            {b.lieu && (
              <p className="flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> {b.lieu}
              </p>
            )}
            <p className="whitespace-pre-line text-[15px]">{b.texte}</p>
            <p className="text-sm text-muted">Publié par {b.ownerNom}</p>
            {b.affiche && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.affiche} alt="" onClick={() => setZoom(true)} className="max-h-96 w-full cursor-zoom-in rounded-xl object-contain" />
            )}
            {b.contact && !fini && (
              <div className="flex gap-2">
                <a href={`tel:${b.contact}`} className="btn-outline flex flex-1 items-center justify-center gap-2">
                  <Phone size={16} /> Appeler
                </a>
                {tel && (
                  <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="btn-outline flex flex-1 items-center justify-center gap-2">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>
            )}
            {b.liens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {b.liens.map((l) => (
                  <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium">
                    <ExternalLink size={13} /> {plateforme(l) === "Lien" ? "Voir le lien" : plateforme(l)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted">{AVERTISSEMENT_DONS}</p>
          {!estAuteur && <SignalerBouton cibleType="fiche" cibleId={`besoin_${b.id}`} cibleNom={`Besoin « ${b.titre} »`} cibleUid={b.ownerUid} libelle="Signaler ce besoin" />}

          {(estAuteur || estAdmin) && (
            <div className="space-y-2">
              <button onClick={basculerResolu} className="btn-outline flex w-full items-center justify-center gap-2">
                <CheckCircle2 size={16} /> {b.resolu ? "Rouvrir ce besoin" : "Marquer comme terminé"}
              </button>
              {confirm ? (
                <div className="card space-y-2 p-4 text-sm">
                  <p>Supprimer définitivement ce besoin ?</p>
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
                  <Trash2 size={15} /> Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {zoom && b?.affiche && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.affiche} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
