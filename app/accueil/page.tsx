"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { ChevronRight, Users, Briefcase, Utensils, CalendarDays, ShieldCheck, HandHelping, Luggage, PartyPopper, ThumbsUp, Plus, Sparkles, FileText, HeartHandshake, Building2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import Avatar from "@/components/Avatar";
import NousContacter from "@/components/NousContacter";
import { compterAttente } from "@/lib/enAttente";
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
      compterAttente()
        .then((r) => setPending(r.total))
        .catch(() => setPending(null));
    }
  }, [profile, isAdmin]);

  const tiles = [
    { href: "/evenements", label: "Événements", hint: "RRTE et entre membres", Icon: CalendarDays, fond: "from-[#E8604C] to-[#B5321F]", grand: true },
    { href: "/demarches", label: "Démarches & papiers", hint: "État civil, mariage, passeport, visas", Icon: FileText, fond: "from-[#8A5CC0] to-[#5B3190]", grand: true },
    { href: "/voyages", label: "Voyageurs & bagages", hint: "Kilos et valises", Icon: Luggage, fond: "from-[#2A92D0] to-[#0F5A8C]", grand: true },
    { href: "/solidarite", label: "Entraide & solidarité", hint: "Associations, collectifs, initiatives", Icon: HeartHandshake, fond: "from-[#E0577F] to-[#A82652]", grand: true },
    { href: "/immobilier", label: "Immobilier", hint: "Location, vente, terrains", Icon: Building2, fond: "from-[#3FA38F] to-[#17695B]", grand: true },
    { href: "/demandes", label: "Demandes", hint: "Je cherche · Je propose", Icon: HandHelping, fond: "from-[#F6C24A] to-[#D99A10]" },
    { href: "/annuaire", label: "Membres", hint: actifs !== null ? `${actifs} inscrits` : "Annuaire", Icon: Users, fond: "from-[#2FB5A8] to-[#1B7F76]" },
    { href: "/entreprises", label: "Entreprises", hint: "Activités des membres", Icon: Briefcase, fond: "from-[#7DB85F] to-[#4A8030]" },
    { href: "/prestataires", label: "Recommandés", hint: "Contacts de confiance", Icon: ThumbsUp, fond: "from-[#5C6168] to-[#26292D]" },
    { href: "/loisirs", label: "Loisirs", hint: "Sorties et bonnes adresses", Icon: PartyPopper, fond: "from-[#EE8A6B] to-[#D84A38]" },
    { href: "/restaurants", label: "Restaurants", hint: "Menus et réservations", Icon: Utensils, fond: "from-[#4FA9DD] to-[#1A7AB8]" },
  ];

  const actions = [
    { href: "/evenements/proposer", label: "Événement", couleur: "bg-[#5B3190]" },
    { href: "/demandes/nouvelle", label: "Demande", couleur: "bg-brand-red" },
    { href: "/voyages/nouveau", label: "Voyage", couleur: "bg-brand-blue" },
    { href: "/loisirs/nouveau", label: "Loisir", couleur: "bg-brand-green" },
    { href: "/prestataires/nouveau", label: "Recommander", couleur: "bg-gold-600" },
  ];

  const delai = (i: number) => ({ animationDelay: `${i * 70}ms` });

  return (
    <AppShell title="RRTE Mali" subtitle="Réunir · Rester · Travailler ensemble">
      <div className="mb-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-ink-2 to-[#3B3F45] p-6 text-ink-fg shadow-lg animate-fade-up">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500 blur-3xl animate-glow" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-brand-blue blur-3xl animate-glow" style={{ animationDelay: "1.5s" }} />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold-400">
              <Sparkles size={14} className="animate-floaty" /> Communauté RRTE
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold leading-tight">Bonjour {profile?.prenom ?? ""} 👋</h2>
            <p className="mt-1 text-sm text-ink-mute">Voici ce qui se passe dans la communauté.</p>
            {actifs !== null && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm backdrop-blur">
                <Users size={15} className="text-gold-400" />
                <span className="font-semibold">{actifs}</span> membres dans l’application
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 p-4 text-ink shadow transition active:scale-[0.98] animate-fade-up"
          style={delai(1)}
        >
          <ShieldCheck size={24} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Administration</p>
            <p className="text-xs text-ink/70">
              {pending === null ? "Valider les inscriptions" : pending === 0 ? "Rien à traiter" : `${pending} élément${pending > 1 ? "s" : ""} à traiter`}
            </p>
          </div>
          {pending ? (
            <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-red px-2 text-sm font-bold text-white">{pending}</span>
          ) : (
            <ChevronRight size={18} />
          )}
        </Link>
      )}

      <div className="mb-5 animate-fade-up" style={delai(2)}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Publier en un geste</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`flex flex-none items-center gap-1.5 rounded-full ${a.couleur} px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-95`}
            >
              <Plus size={15} /> {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {tiles.map(({ href, label, hint, Icon, fond, grand }, i) => (
          <Link
            key={href}
            href={href}
            style={delai(i + 3)}
            className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${fond} p-4 text-white shadow-md transition duration-200 active:scale-[0.97] animate-fade-up ${
              grand ? "col-span-2 flex items-center gap-4 py-5" : "min-h-[128px]"
            }`}
          >
            <Icon
              size={grand ? 90 : 76}
              strokeWidth={1.2}
              className="pointer-events-none absolute -bottom-3 -right-3 text-white/20 transition duration-300 group-hover:rotate-6 group-hover:scale-110"
            />
            <div className={`relative flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur ${grand ? "h-14 w-14 flex-none" : "mb-6 h-11 w-11"}`}>
              <Icon size={grand ? 28 : 22} strokeWidth={1.75} />
            </div>
            <div className="relative">
              <p className={`font-display font-bold leading-tight ${grand ? "text-xl" : "text-[17px]"}`}>{label}</p>
              <p className="text-xs text-white/85">{hint}</p>
            </div>
          </Link>
        ))}
      </div>

      {[
        { titre: "Nouveaux membres", liste: nouveaux },
        { titre: "Fiches mises à jour récemment", liste: recents },
      ].map(
        ({ titre, liste }) =>
          liste.length > 0 && (
            <div key={titre} className="mb-5 animate-fade-up">
              <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
                <span className="h-5 w-1.5 rounded-full bg-gold-500" /> {titre}
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {liste.map((f) => (
                  <Link
                    key={f.id}
                    href={`/annuaire/${f.id}`}
                    className="card flex w-28 flex-none flex-col items-center gap-2 border-b-4 border-b-gold-500 p-3 text-center shadow-sm transition active:scale-95"
                  >
                    <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={52} photo={f.photo} />
                    <p className="line-clamp-2 text-xs font-semibold">{nomComplet(f)}</p>
                  </Link>
                ))}
              </div>
            </div>
          ),
      )}
      <div className="mb-2 animate-fade-up">
        <NousContacter />
      </div>
    </AppShell>
  );
}
