"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { CalendarDays, Clock, MapPin, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EventItem, dayParts, isUpcoming } from "@/lib/events";

export default function EvenementsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"avenir" | "passes" | "moi">("avenir");
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "events"), orderBy("date", "asc")));
    setEvents(
      snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          titre: x.titre ?? "",
          description: x.description ?? "",
          date: x.date ?? "",
          heure: x.heure ?? "",
          lieu: x.lieu ?? "",
          attendees: Array.isArray(x.attendees) ? x.attendees : [],
          created_by: x.created_by ?? "",
        } as EventItem;
      })
    );
  }, []);

  useEffect(() => {
    if (profile?.statut !== "actif") return;
    load()
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [profile, load]);

  async function toggle(ev: EventItem) {
    if (!user) return;
    const going = ev.attendees.includes(user.uid);
    setBusy(ev.id);
    try {
      await updateDoc(doc(db, "events", ev.id), {
        attendees: going ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      setEvents((list) =>
        list.map((e) =>
          e.id === ev.id
            ? { ...e, attendees: going ? e.attendees.filter((u) => u !== user.uid) : [...e.attendees, user.uid] }
            : e
        )
      );
    } finally {
      setBusy(null);
    }
  }

  const shown = events
    .filter((e) =>
      tab === "avenir" ? isUpcoming(e.date) : tab === "passes" ? !isUpcoming(e.date) : !!user && e.attendees.includes(user.uid)
    )
    .sort((a, b) => (tab === "passes" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "avenir", label: "À venir" },
    { key: "passes", label: "Passés" },
    { key: "moi", label: "Je participe" },
  ];

  return (
    <AppShell title="Événements" subtitle="Nos prochaines rencontres">
      <div className="mb-4 flex items-center gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-none rounded-full border px-4 py-1.5 text-sm ${
              tab === t.key ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
        {isAdmin && (
          <Link
            href="/evenements/nouveau"
            className="ml-auto flex flex-none items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-ink-fg"
          >
            <Plus size={16} /> Créer
          </Link>
        )}
      </div>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <CalendarDays size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">
            {tab === "moi" ? "Vous n’êtes inscrit à aucun événement." : "Aucun événement pour le moment."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {shown.map((ev) => {
          const { jour, mois } = dayParts(ev.date);
          const going = !!user && ev.attendees.includes(user.uid);
          return (
            <div key={ev.id} className="card overflow-hidden">
              <Link href={`/evenements/${ev.id}`} className="flex items-center gap-4 bg-ink p-4 text-ink-fg">
                <div className="w-14 flex-none rounded-xl bg-gold-500 py-2 text-center text-ink">
                  <b className="block font-display text-2xl leading-none">{jour}</b>
                  <span className="text-[10px] font-semibold tracking-widest">{mois}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold leading-snug">{ev.titre}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-mute">
                    {ev.heure && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} /> {ev.heure}
                      </span>
                    )}
                    {ev.lieu && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {ev.lieu}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted">
                  {ev.attendees.length} inscrit{ev.attendees.length > 1 ? "s" : ""}
                </span>
                {isUpcoming(ev.date) && (
                  <button
                    disabled={busy === ev.id}
                    onClick={() => toggle(ev)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                      going ? "border border-line bg-white text-muted" : "bg-gold-500 text-ink"
                    }`}
                  >
                    {going ? "Je ne viens plus" : "Je viens"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
