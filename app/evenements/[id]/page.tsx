"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { arrayRemove, arrayUnion, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Clock, MapPin, Users, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EventItem, isUpcoming, longDate } from "@/lib/events";

export default function EvenementDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [ev, setEv] = useState<EventItem | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "events", id))
      .then((snap) => {
        if (!snap.exists()) return setState("absent");
        const x = snap.data();
        setEv({
          id: snap.id,
          titre: x.titre ?? "",
          description: x.description ?? "",
          date: x.date ?? "",
          heure: x.heure ?? "",
          lieu: x.lieu ?? "",
          attendees: Array.isArray(x.attendees) ? x.attendees : [],
          created_by: x.created_by ?? "",
        });
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  async function toggle() {
    if (!ev || !user) return;
    const going = ev.attendees.includes(user.uid);
    setBusy(true);
    try {
      await updateDoc(doc(db, "events", ev.id), {
        attendees: going ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setEv({
        ...ev,
        attendees: going ? ev.attendees.filter((u) => u !== user.uid) : [...ev.attendees, user.uid],
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!ev) return;
    await deleteDoc(doc(db, "events", ev.id));
    router.push("/evenements");
  }

  const going = !!(ev && user && ev.attendees.includes(user.uid));

  return (
    <AppShell title={ev?.titre ?? "Événement"} subtitle={ev ? longDate(ev.date) : undefined}>
      <Link href="/evenements" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Événements
      </Link>

      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Événement introuvable.</p>}

      {ev && state === "ok" && (
        <div className="space-y-4">
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
            <div className="flex items-center gap-3 p-4">
              <Users size={20} className="text-gold-700" strokeWidth={1.75} /> {ev.attendees.length} inscrit
              {ev.attendees.length > 1 ? "s" : ""}
            </div>
          </div>

          {ev.description && (
            <div>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Programme</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{ev.description}</p>
            </div>
          )}

          {isUpcoming(ev.date) && (
            <button
              disabled={busy}
              onClick={toggle}
              className={going ? "flex w-full items-center justify-center rounded-full border border-line bg-white px-6 py-3.5 font-semibold text-muted" : "btn-gold"}
            >
              {going ? "Je ne viens plus" : "Je m’inscris"}
            </button>
          )}

          {isAdmin && (
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
