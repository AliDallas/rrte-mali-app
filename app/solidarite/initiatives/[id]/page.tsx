"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { CalendarDays, ChevronLeft, ExternalLink, MapPin, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import SignalerBouton from "@/components/SignalerBouton";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Initiative, dateFr, initiativeDepuisDoc } from "@/lib/solidarite";
import { plateforme } from "@/lib/liens";
import { viderCache } from "@/lib/cache";

export default function InitiativeDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [i, setI] = useState<Initiative | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [confirm, setConfirm] = useState(false);
  const [zoom, setZoom] = useState(false);

  const charger = useCallback(async () => {
    if (!id) return;
    const d = await getDoc(doc(db, "initiatives", id));
    if (!d.exists()) return setState("absent");
    setI(initiativeDepuisDoc(d.id, d.data()));
    setState("ok");
  }, [id]);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    charger().catch(() => setState("absent"));
  }, [profile, charger]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "initiatives", id), { statut: "valide" });
    viderCache("initiatives");
    await charger();
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "initiatives", id));
    viderCache("initiatives");
    router.push("/solidarite/initiatives");
  }

  const estAdmin = profile?.role === "admin";
  const estAuteur = !!i && i.ownerUid === user?.uid;

  return (
    <AppShell title={i?.titre || "Initiative"} subtitle={i?.categorie || "Initiatives"}>
      <Link href="/solidarite/initiatives" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Initiatives
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Initiative introuvable ou supprimée.</p>}
      {state === "ok" && i && (
        <div className="space-y-4">
          {i.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {estAdmin && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette initiative
                </button>
              )}
            </div>
          )}
          <div className="card space-y-3 p-5">
            <p className="text-sm text-muted">Proposée par {i.ownerNom}</p>
            {(i.date || i.lieu) && (
              <p className="flex flex-wrap items-center gap-x-4 text-sm text-muted">
                {i.date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} /> {dateFr(i.date)}
                  </span>
                )}
                {i.lieu && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {i.lieu}
                  </span>
                )}
              </p>
            )}
            <p className="whitespace-pre-line text-[15px]">{i.texte}</p>
            {i.affiche && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.affiche} alt="" onClick={() => setZoom(true)} className="max-h-96 w-full cursor-zoom-in rounded-xl object-contain" />
            )}
            {i.liens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {i.liens.map((l) => (
                  <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium">
                    <ExternalLink size={13} /> {plateforme(l) === "Lien" ? "Voir le lien" : plateforme(l)}
                  </a>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted">
            RRTE et son application ne sont pas responsables du contenu des initiatives, notamment au regard du droit malien.
          </p>
          {!estAuteur && <SignalerBouton cibleType="fiche" cibleId={`init_${i.id}`} cibleNom={`Initiative « ${i.titre} »`} cibleUid={i.ownerUid} libelle="Signaler cette initiative" />}
          {(estAdmin || estAuteur) &&
            (confirm ? (
              <div className="card space-y-2 p-4 text-sm">
                <p>Supprimer définitivement cette initiative ?</p>
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
                <Trash2 size={15} /> Supprimer l’initiative
              </button>
            ))}
        </div>
      )}
      {zoom && i?.affiche && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.affiche} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </AppShell>
  );
}
