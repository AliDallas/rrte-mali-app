"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDoc, getDocs, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { ChevronLeft, MapPin, MessageCircle, Phone, Star, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import Etoiles from "@/components/Etoiles";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Avis, Prestataire, moyenne, prestataireDepuisDoc } from "@/lib/prestataires";
import { chiffres } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

export default function PrestataireDetailPage() {
  const id = useParams<{ id: string }>()?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [p, setP] = useState<Prestataire | null>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [note, setNote] = useState(0);
  const [comm, setComm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState(false);

  const charger = useCallback(async () => {
    if (!id) return;
    const s = await getDoc(doc(db, "prestataires", id));
    if (!s.exists()) return setState("absent");
    setP(prestataireDepuisDoc(s.id, s.data()));
    const r = await getDocs(collection(db, "prestataires", id, "avis"));
    const liste = r.docs.map((d) => d.data() as Avis);
    setAvis(liste);
    const mien = liste.find((a) => a.uid === user?.uid);
    if (mien) {
      setNote(mien.note);
      setComm(mien.commentaire);
    }
    setState("ok");
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
      const pref = doc(db, "prestataires", id);
      const aref = doc(db, "prestataires", id, "avis", user.uid);
      await runTransaction(db, async (tx) => {
        const [ps, as] = await Promise.all([tx.get(pref), tx.get(aref)]);
        const d = ps.data() ?? {};
        const ancien = as.exists() ? (as.data().note as number) : 0;
        tx.set(aref, {
          uid: user.uid,
          auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
          note,
          commentaire: comm.trim(),
          createdAt: serverTimestamp(),
        });
        tx.update(pref, {
          nbAvis: (typeof d.nbAvis === "number" ? d.nbAvis : 0) + (as.exists() ? 0 : 1),
          sommeNotes: (typeof d.sommeNotes === "number" ? d.sommeNotes : 0) - ancien + note,
        });
      });
      viderCache("prestataires");
      await charger();
    } catch {
      setErr("Impossible d’enregistrer votre avis. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function supprimer() {
    if (!id) return;
    await deleteDoc(doc(db, "prestataires", id));
    viderCache("prestataires");
    router.push("/prestataires");
  }

  async function valider() {
    if (!id) return;
    await updateDoc(doc(db, "prestataires", id), { statut: "valide" });
    viderCache("prestataires");
    await charger();
  }

  const peutGerer = !!p && (profile?.role === "admin" || p.ownerUid === user?.uid);

  return (
    <AppShell title={p?.nom || "Contact"} subtitle={p?.metier || "Recommandé par un membre"}>
      <Link href="/prestataires" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Recommandés
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {state === "ok" && p && (
        <div className="space-y-4">
          {p.statut === "en_attente" && (
            <div className="rounded-xl bg-brand-red/10 p-3 text-sm">
              <p className="font-semibold">En attente de validation par un administrateur</p>
              {profile?.role === "admin" && (
                <button onClick={valider} className="btn-gold mt-3">
                  Valider cette recommandation
                </button>
              )}
            </div>
          )}
          <div className="card space-y-2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-xl font-bold">{p.nom}</p>
                <p className="text-sm text-muted">{p.metier}</p>
              </div>
              <div className="flex-none text-right">
                <Etoiles note={moyenne(p)} size={18} />
                <p className="text-xs text-muted">
                  {p.nbAvis > 0 ? `${moyenne(p).toFixed(1)} · ${p.nbAvis} avis` : "Pas encore noté"}
                </p>
              </div>
            </div>
            {p.description && <p className="whitespace-pre-line text-[15px]">{p.description}</p>}
            {p.ownerNom && <p className="text-xs font-semibold text-gold-700">Recommandé par {p.ownerNom}</p>}
          </div>

          <div className="card divide-y divide-line">
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
              <span className="flex-1 text-[15px]">{p.tel}</span>
              <a href={`tel:${p.tel}`} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
                Appeler
              </a>
              <a
                href={`https://wa.me/${chiffres(p.tel)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
              >
                <MessageCircle size={17} />
              </a>
            </div>
            {p.quartier && (
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="text-[15px]">{p.quartier}</span>
              </div>
            )}
          </div>

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
              placeholder="Votre expérience (qualité, prix, ponctualité…)"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            {err && <p className="text-sm text-brand-red">{err}</p>}
            <button type="submit" disabled={saving || note < 1} className="btn-gold">
              {saving ? "Envoi..." : "Publier mon avis"}
            </button>
          </form>

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
                </div>
              ))}
            </div>
          )}

          {peutGerer && (
            <div>
              {confirm ? (
                <button onClick={supprimer} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-3 text-sm font-semibold text-white">
                  <Trash2 size={16} /> Confirmer la suppression
                </button>
              ) : (
                <button onClick={() => setConfirm(true)} className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-white py-3 text-sm font-semibold text-brand-red">
                  <Trash2 size={16} /> Supprimer cette recommandation
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
