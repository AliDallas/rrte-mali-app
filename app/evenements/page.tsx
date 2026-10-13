"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { arrayRemove, arrayUnion, collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { CalendarDays, Clock, MapPin, Plus, Users } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { EventCategorie, EventItem, dayParts, eventDepuisDoc, isUpcoming } from "@/lib/events";

export default function EvenementsPage() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cat, setCat] = useState<EventCategorie>("rrte");
  const [tab, setTab] = useState<"avenir" | "passes" | "moi">("avenir");
  const [busy, setBusy] = useState<string | null>(null);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "events"), orderBy("date", "asc")));
    setEvents(snap.docs.map((d) => eventDepuisDoc(d.id, d.data())));
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
      await updateDoc(doc(db, "events", ev.id), { attendees: going ? arrayRemove(user.uid) : arrayUnion(user.uid) });
      setEvents((list) =>
        list.map((e) =>
          e.id === ev.id ? { ...e, attendees: going ? e.attendees.filter((u) => u !== user.uid) : [...e.attendees, user.uid] } : e
        )
      );
    } finally {
      setBusy(null);
    }
  }

  const visibles = events.filter((e) => e.statut !== "en_attente" || isAdmin || e.created_by === user?.uid);
  const nbMembres = visibles.filter((e) => e.categorie === "membres" && isUpcoming(e.date)).length;
  const nbRrte = visibles.filter((e) => e.categorie === "rrte" && isUpcoming(e.date)).length;

  const shown = visibles
    .filter((e) => e.categorie === cat)
    .filter((e) => (tab === "avenir" ? isUpcoming(e.date) : tab === "passes" ? !isUpcoming(e.date) : !!user && e.attendees.includes(user.uid)))
    .sort((a, b) => (tab === "passes" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "avenir", label: "À venir" },
    { key: "passes", label: "Passés" },
    { key: "moi", label: "Je participe" },
  ];

  const membres = cat === "membres";

  return (
    <AppShell title="Événements" subtitle="Les rendez-vous de la communauté">
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-line/60 p-1.5">
        {([
          ["rrte", "Événements RRTE", nbRrte],
          ["membres", "Entre membres", nbMembres],
        ] as [EventCategorie, string, number][]).map(([k, l, n]) => (
          <button
            key={k}
            onClick={() => setCat(k)}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              cat === k ? "bg-ink text-ink-fg shadow" : "text-muted"
            }`}
          >
            {l}
            {n > 0 && <span className={`rounded-full px-2 py-0.5 text-xs ${cat === k ? "bg-gold-500 text-ink" : "bg-white"}`}>{n}</span>}
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-muted">
        {membres
          ? "Repas entre amies, vide-dressing, ateliers, événements d’associations : proposés par les membres."
          : "Les grands rendez-vous organisés par le groupe RRTE."}
      </p>

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
        {(membres || isAdmin) && (
          <Link
            href={membres ? "/evenements/proposer" : "/evenements/nouveau"}
            className="ml-auto flex flex-none items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-ink-fg"
          >
            <Plus size={16} /> {membres ? "Proposer" : "Créer"}
          </Link>
        )}
      </div>

      {loaded && shown.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
            <CalendarDays size={22} strokeWidth={1.75} />
          </div>
          <p className="text-muted">
            {tab === "moi"
              ? "Vous n’êtes inscrit à aucun événement."
              : membres
              ? "Aucun événement pour le moment. Proposez le premier !"
              : "Aucun événement pour le moment."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {shown.map((ev) => {
          const { jour, mois } = dayParts(ev.date);
          const going = !!user && ev.attendees.includes(user.uid);
          return (
            <div key={ev.id} className="card overflow-hidden">
              <Link href={`/evenements/${ev.id}`} className={`flex items-center gap-4 p-4 text-ink-fg ${membres ? "bg-gradient-to-br from-[#5B3190] to-ink" : "bg-ink"}`}>
                {ev.vignette ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ev.vignette} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
                ) : (
                  <div className="w-14 flex-none rounded-xl bg-gold-500 py-2 text-center text-ink">
                    <b className="block font-display text-2xl leading-none">{jour}</b>
                    <span className="text-[10px] font-semibold tracking-widest">{mois}</span>
                  </div>
                )}
                <div className="min-w-0">
                  {membres && ev.typeEvenement && <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">{ev.typeEvenement}</p>}
                  <h3 className="font-display text-lg font-bold leading-snug">{ev.titre}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-mute">
                    {ev.vignette && <span>{jour} {mois}</span>}
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
                  {membres && (ev.organisateurNom || ev.participation) && (
                    <p className="mt-1 text-xs text-gold-400">{[ev.organisateurNom, ev.participation].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              </Link>
              {ev.statut === "en_attente" && <p className="bg-brand-red/10 px-4 py-2 text-xs font-semibold text-brand-red">En attente de validation</p>}
              <div className="flex items-center justify-between px-4 py-3">
                {isUpcoming(ev.date) ? (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Users size={14} /> {ev.attendees.length} inscrit{ev.attendees.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-sm text-muted">Événement passé</span>
                )}
                {isUpcoming(ev.date) && ev.statut !== "en_attente" && (
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
