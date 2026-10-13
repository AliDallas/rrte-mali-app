"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, ExternalLink, MapPin, Pencil, Trash2, Clock, Wallet } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Demarche, demarcheDepuisDoc, lignes } from "@/lib/demarches";
import { dateFr } from "@/lib/voyages";
import { plateforme } from "@/lib/liens";
import { viderCache } from "@/lib/cache";

export default function DemarcheDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [d, setD] = useState<Demarche | null>(null);
  const [etat, setEtat] = useState<"chargement" | "ok" | "absent">("chargement");
  const [confirm, setConfirm] = useState(false);
  const [coches, setCoches] = useState<Record<number, boolean>>({});

  async function charger() {
    if (!id) return;
    const s = await getDoc(doc(db, "demarches", id));
    if (!s.exists()) return setEtat("absent");
    setD(demarcheDepuisDoc(s.id, s.data()));
    setEtat("ok");
  }

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    charger().catch(() => setEtat("absent"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile]);

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "demarches", id), { statut: "valide" });
    viderCache("demarches");
    await charger();
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "demarches", id));
    viderCache("demarches");
    router.push("/demarches");
  }

  const admin = profile?.role === "admin";
  const peutSupprimer = !!d && (admin || d.ownerUid === user?.uid);
  const peutModifier = !!d && (admin || (d.ownerUid === user?.uid && d.statut === "en_attente"));
  const etapes = lignes(d?.etapes ?? "");
  const pieces = lignes(d?.pieces ?? "");

  return (
    <AppShell title={d?.titre || "Démarche"} subtitle={d ? `${d.categorie.split(" (")[0]} · ${d.lieu}` : "Démarches & papiers"}>
      <Link href="/demarches" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Démarches & papiers
      </Link>
      {etat === "chargement" && <p className="text-center text-muted">Chargement...</p>}
      {etat === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {etat === "ok" && d && (
        <div className="space-y-4">
          {d.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {admin && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider et publier cette fiche
                </button>
              )}
            </div>
          )}

          {d.resume && <div className="card p-5 text-[15px]">{d.resume}</div>}

          {(d.cout || d.delai) && (
            <div className="grid grid-cols-2 gap-3">
              {d.cout && (
                <div className="card flex items-center gap-3 p-4">
                  <Wallet size={20} className="text-gold-600" />
                  <div>
                    <p className="text-xs text-muted">Coût</p>
                    <p className="font-semibold">{d.cout}</p>
                  </div>
                </div>
              )}
              {d.delai && (
                <div className="card flex items-center gap-3 p-4">
                  <Clock size={20} className="text-brand-blue" />
                  <div>
                    <p className="text-xs text-muted">Délai</p>
                    <p className="font-semibold">{d.delai}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {etapes.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Les étapes</h2>
              <ol className="space-y-3">
                {etapes.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-ink">{i + 1}</span>
                    <p className="pt-0.5 text-[15px]">{e}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {pieces.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-1 font-display text-lg font-bold">Pièces à fournir</h2>
              <p className="mb-3 text-xs text-muted">Cochez au fur et à mesure (non enregistré).</p>
              <ul className="space-y-2">
                {pieces.map((p, i) => (
                  <li key={i}>
                    <label className="flex items-start gap-3 text-[15px]">
                      <input type="checkbox" checked={!!coches[i]} onChange={() => setCoches({ ...coches, [i]: !coches[i] })} className="mt-1 h-4 w-4" />
                      <span className={coches[i] ? "text-muted line-through" : ""}>{p}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {d.adresse && (
            <div className="card flex items-start gap-3 p-4">
              <MapPin size={18} className="mt-0.5 flex-none text-brand-red" />
              <p className="whitespace-pre-line text-[15px]">{d.adresse}</p>
            </div>
          )}

          {d.liens.length > 0 && (
            <div className="card divide-y divide-line">
              {d.liens.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3">
                  <ExternalLink size={17} className="text-gold-600" />
                  <span className="flex-1 truncate text-[15px] font-semibold">
                    {plateforme(u) === "Lien" ? u.replace(/^https?:\/\/(www\.)?/, "") : plateforme(u)}
                  </span>
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-muted">
            Partagé par {d.ownerNom || "RRTE"}
            {d.verifieLe && ` · information vérifiée le ${dateFr(d.verifieLe)}`}. Les procédures changent : vérifiez toujours auprès du service officiel
            avant de vous déplacer. Cette fiche est une aide entre membres, pas un conseil juridique.
          </p>

          <Link href="/demandes/nouvelle" className="btn-gold">
            Poser une question aux membres
          </Link>

          <div className="flex justify-center">
            <SignalerBouton cibleType="fiche" cibleId={d.id} cibleNom={`Fiche « ${d.titre} »`} cibleUid={d.ownerUid} libelle="Signaler cette annonce ou ce contenu" />
          </div>

          <div className="flex items-center justify-center gap-6">
            {peutModifier && (
              <Link href={`/demarches/${d.id}/modifier`} className="flex items-center gap-2 text-sm text-muted">
                <Pencil size={15} /> Modifier
              </Link>
            )}
            {peutSupprimer &&
              (confirm ? (
                <span className="flex items-center gap-3 text-sm">
                  <button onClick={supprimer} className="font-semibold text-brand-red">
                    Confirmer
                  </button>
                  <button onClick={() => setConfirm(false)} className="text-muted">
                    Annuler
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirm(true)} className="flex items-center gap-2 text-sm text-muted">
                  <Trash2 size={15} /> Supprimer
                </button>
              ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
