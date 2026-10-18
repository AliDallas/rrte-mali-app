"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Car, MessageCircle, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { lienWhatsAppVers } from "@/lib/contact";

const input = "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500";

interface Offre {
  uid: string;
  nom: string;
  tel: string;
  places: number;
  depart: string;
  heure: string;
  note: string;
}

/** Covoiturage d'un événement : l'administrateur l'active, puis chaque membre indique ses places disponibles. */
export default function Covoiturage({ eventId, titre, actif, onActive }: { eventId: string; titre: string; actif: boolean; onActive: (v: boolean) => void }) {
  const { user, profile } = useAuth();
  const admin = profile?.role === "admin";
  const [offres, setOffres] = useState<Offre[] | null>(null);
  const [places, setPlaces] = useState("2");
  const [depart, setDepart] = useState("");
  const [heure, setHeure] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const r = await getDocs(collection(db, "events", eventId, "covoiturage"));
      const liste = r.docs.map((d) => d.data() as Offre);
      setOffres(liste);
      const mienne = liste.find((o) => o.uid === user?.uid);
      if (mienne) {
        setPlaces(String(mienne.places));
        setDepart(mienne.depart);
        setHeure(mienne.heure);
        setNote(mienne.note);
      }
    } catch {
      setOffres([]);
    }
  }, [eventId, user]);

  useEffect(() => {
    if (actif) charger();
  }, [actif, charger]);

  async function basculer(v: boolean) {
    setBusy(true);
    setErreur("");
    try {
      await updateDoc(doc(db, "events", eventId), { covoiturage: v });
      onActive(v);
    } catch {
      setErreur("Impossible de modifier le covoiturage.");
    }
    setBusy(false);
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    const n = Math.round(Number(places));
    if (!Number.isFinite(n) || n < 0 || n > 8) return setErreur("Indiquez un nombre de places entre 0 et 8.");
    setBusy(true);
    setErreur("");
    try {
      await setDoc(doc(db, "events", eventId, "covoiturage", user.uid), {
        uid: user.uid,
        nom: `${profile.prenom} ${profile.nom}`.trim(),
        tel: profile.telephone ?? "",
        places: n,
        depart: depart.trim(),
        heure: heure.trim(),
        note: note.trim(),
        majLe: serverTimestamp(),
      });
      await charger();
    } catch {
      setErreur("Impossible d’enregistrer. Réessayez.");
    }
    setBusy(false);
  }

  async function retirer() {
    if (!user) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "events", eventId, "covoiturage", user.uid));
      setPlaces("2");
      setDepart("");
      setHeure("");
      setNote("");
      await charger();
    } catch {
      setErreur("Impossible de retirer votre offre.");
    }
    setBusy(false);
  }

  if (!actif) {
    return admin ? (
      <button onClick={() => basculer(true)} disabled={busy} className="btn-outline flex w-full items-center justify-center gap-2">
        <Car size={16} /> Activer le covoiturage pour cet événement
      </button>
    ) : null;
  }

  const mienne = (offres ?? []).find((o) => o.uid === user?.uid);
  const autres = (offres ?? []).filter((o) => o.uid !== user?.uid);
  const totalPlaces = (offres ?? []).reduce((t, o) => t + o.places, 0);

  return (
    <section className="card space-y-3 p-5">
      <div className="flex items-center gap-2">
        <Car size={20} className="text-gold-700" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-bold">Covoiturage</h2>
        {offres && <span className="ml-auto text-sm text-muted">{totalPlaces} place{totalPlaces > 1 ? "s" : ""}</span>}
      </div>
      <p className="text-xs text-muted">Vous avez de la place dans votre voiture ? Indiquez-la. Les autres membres vous contactent directement sur WhatsApp.</p>
      {erreur && <p className="text-sm text-brand-red">{erreur}</p>}

      {autres.map((o) => {
        const lien = lienWhatsAppVers(o.tel, `Bonjour ${o.nom}, je vous contacte via l’application RRTE pour le covoiturage de l’événement « ${titre} ». Avez-vous encore une place ?`);
        return (
          <div key={o.uid} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{o.nom}</p>
              <p className="text-xs text-muted">
                {[o.depart && `Départ : ${o.depart}`, o.heure && `à ${o.heure}`, o.note].filter(Boolean).join(" · ") || "Départ à préciser avec le conducteur"}
              </p>
            </div>
            <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-semibold ${o.places > 0 ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-muted"}`}>
              {o.places > 0 ? `${o.places} place${o.places > 1 ? "s" : ""}` : "Complet"}
            </span>
            {lien && o.places > 0 && (
              <a href={lien} target="_blank" rel="noopener noreferrer" aria-label={`Écrire à ${o.nom} sur WhatsApp`} className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gold-500 text-ink">
                <MessageCircle size={17} />
              </a>
            )}
          </div>
        );
      })}
      {offres && autres.length === 0 && !mienne && <p className="text-sm text-muted">Personne n’a encore proposé de place.</p>}

      <form onSubmit={enregistrer} className="space-y-2 rounded-2xl bg-gold-500/10 p-3">
        <p className="text-sm font-semibold">{mienne ? "Mon offre" : "Je propose des places"}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-medium">Places disponibles
            <input type="number" inputMode="numeric" min="0" max="8" value={places} onChange={(e) => setPlaces(e.target.value)} className={input} />
          </label>
          <label className="block text-xs font-medium">Heure de départ
            <input value={heure} onChange={(e) => setHeure(e.target.value)} placeholder="Ex. 9h30" className={input} />
          </label>
        </div>
        <label className="block text-xs font-medium">Quartier de départ
          <input value={depart} onChange={(e) => setDepart(e.target.value)} placeholder="Ex. ACI 2000" className={input} />
        </label>
        <label className="block text-xs font-medium">Précision (facultatif)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. participation aux frais d’essence" className={input} />
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="btn-gold flex-1">{mienne ? "Mettre à jour" : "Proposer"}</button>
          {mienne && (
            <button type="button" onClick={retirer} disabled={busy} aria-label="Retirer mon offre" className="btn-outline px-4">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted">Votre numéro de téléphone est partagé avec les membres pour qu’ils puissent vous écrire. Mettez 0 place quand votre voiture est pleine.</p>
      </form>

      {admin && (
        <button onClick={() => basculer(false)} disabled={busy} className="text-xs text-muted underline">
          Désactiver le covoiturage
        </button>
      )}
    </section>
  );
}
