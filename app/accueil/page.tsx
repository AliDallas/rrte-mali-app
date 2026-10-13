"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ChevronRight, Users, Briefcase, Utensils, CalendarDays, ShieldCheck, HandHelping, Luggage, PartyPopper } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import Avatar from "@/components/Avatar";
import { Fiche, ficheDepuisDoc, nomComplet } from "@/lib/fiches";

export default function AccueilPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [pending, setPending] = useState<number | null>(null);
  const [actifs, setActifs] = useState<number | null>(null);
  const [nouveaux, setNouveaux] = useState<Fiche[]>([]);
  const [recents, setRecents] = useState<Fiche[]>([]);

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    getCountFromServer(query(collection(db, "users"), where("statut", "==", "actif")))
      .then((s) => setActifs(s.data().count))
      .catch(() => setActifs(null));
    const mois = Date.now() - 30 * 24 * 3600 * 1000;
    getDocs(query(collection(db, "fiches"), orderBy("inscritLe", "desc"), limit(8)))
      .then((r) => setNouveaux(r.docs.map((d) => ficheDepuisDoc(d.id, d.data())).filter((f) => f.inscritLe > mois)))
      .catch(() => undefined);
    getDocs(query(collection(db, "fiches"), orderBy("majLe", "desc"), limit(8)))
      .then((r) => setRecents(r.docs.map((d) => ficheDepuisDoc(d.id, d.data())).filter((f) => f.majLe > mois)))
      .catch(() => undefined);
    if (isAdmin) {
      getCountFromServer(query(collection(db, "users"), where("statut", "==", "en_attente")))
        .then((s) => setPending(s.data().count))
        .catch(() => setPending(null));
    }
  }, [profile, isAdmin]);

  const tiles = [
    { href: "/demandes", label: "Demandes", hint: "Je cherche · Je propose", Icon: HandHelping },
    { href: "/annuaire", label: "Membres", hint: actifs !== null ? `${actifs} inscrits dans l’application` : "Annuaire", Icon: Users },
    { href: "/entreprises", label: "Entreprises", hint: "Les activités de la communauté", Icon: Briefcase },
    { href: "/voyages", label: "Voyageurs & bagages", hint: "Kilos et valises disponibles", Icon: Luggage },
    { href: "/loisirs", label: "Loisirs", hint: "Sorties, bonnes adresses, vidéos", Icon: PartyPopper },
    { href: "/restaurants", label: "Restaurants", hint: "Menus et réservations", Icon: Utensils },
    { href: "/evenements", label: "Événements", hint: "Bientôt disponible", Icon: CalendarDays },
  ];

  return (
    <AppShell title={`Bonjour ${profile?.prenom ?? ""}`} subtitle="Voici ce qui se passe dans la communauté">
      {isAdmin && (
        <Link
          href="/admin"
          className="mb-4 flex items-center gap-3 rounded-2xl bg-ink p-4 text-ink-fg"
        >
          <ShieldCheck className="text-gold-500" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Valider les inscriptions</p>
            <p className="text-xs text-ink-mute">
              {pending === null ? "Administration" : pending === 0 ? "Aucune demande en attente" : `${pending} demande${pending > 1 ? "s" : ""} en attente`}
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-mute" />
        </Link>
      )}
      {[
        { titre: "Nouveaux membres", liste: nouveaux },
        { titre: "Fiches mises à jour récemment", liste: recents },
      ].map(
        ({ titre, liste }) =>
          liste.length > 0 && (
            <div key={titre} className="mb-5">
              <h2 className="mb-2 font-display text-lg font-bold">{titre}</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {liste.map((f) => (
                  <Link key={f.id} href={`/annuaire/${f.id}`} className="card flex w-24 flex-none flex-col items-center gap-1 p-3 text-center">
                    <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={44} photo={f.photo} />
                    <p className="line-clamp-2 text-xs font-semibold">{nomComplet(f)}</p>
                  </Link>
                ))}
              </div>
            </div>
          ),
      )}
      <div className="space-y-3">
        {tiles.map(({ href, label, hint, Icon }) => (
          <Link key={href} href={href} className="card flex items-center gap-4 p-4 transition hover:border-gold-500">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted">{hint}</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
