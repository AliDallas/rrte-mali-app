"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { ChevronRight, Users, Briefcase, Utensils, CalendarDays, ShieldCheck } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";

export default function AccueilPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [pending, setPending] = useState<number | null>(null);
  const [actifs, setActifs] = useState<number | null>(null);

  useEffect(() => {
    if (!profile || profile.statut !== "actif") return;
    getCountFromServer(query(collection(db, "users"), where("statut", "==", "actif")))
      .then((s) => setActifs(s.data().count))
      .catch(() => setActifs(null));
    if (isAdmin) {
      getCountFromServer(query(collection(db, "users"), where("statut", "==", "en_attente")))
        .then((s) => setPending(s.data().count))
        .catch(() => setPending(null));
    }
  }, [profile, isAdmin]);

  const tiles = [
    { href: "/annuaire", label: "Membres", hint: actifs !== null ? `${actifs} inscrits dans l’application` : "Annuaire", Icon: Users },
    { href: "/entreprises", label: "Entreprises", hint: "Les activités de la communauté", Icon: Briefcase },
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
