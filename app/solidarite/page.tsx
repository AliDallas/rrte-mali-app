"use client";

import { HeartHandshake, Building2, Users, Lightbulb, Lock, ShieldAlert } from "lucide-react";
import AppShell from "@/components/AppShell";

const RUBRIQUES = [
  {
    titre: "Associations",
    texte: "Un administrateur par association, validé par les administrateurs RRTE, publie ici les activités, photos et actions.",
    Icon: Building2,
    fond: "from-[#2A92D0] to-[#0F5A8C]",
  },
  {
    titre: "Collectifs",
    texte: "Un administrateur par collectif (aide aux orphelins, soutien aux familles…), validé par les administrateurs RRTE.",
    Icon: Users,
    fond: "from-[#2FB5A8] to-[#1B7F76]",
  },
  {
    titre: "Initiatives",
    texte: "Tous les membres peuvent proposer une initiative. Elle est publiée après validation par un administrateur.",
    Icon: Lightbulb,
    fond: "from-[#F6C24A] to-[#D99A10]",
  },
];

export default function SolidaritePage() {
  return (
    <AppShell title="Entraide & solidarité" subtitle="Associations, collectifs et initiatives">
      <div className="space-y-3">
        {RUBRIQUES.map(({ titre, texte, Icon, fond }) => (
          <div key={titre} className={`rounded-2xl bg-gradient-to-br ${fond} p-4 text-white shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Icon size={22} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{titre}</p>
                <p className="text-sm text-white/90">{texte}</p>
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
              <Lock size={12} /> Bientôt disponible
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-4 space-y-3 p-4 text-sm text-muted">
        <div className="flex gap-3">
          <HeartHandshake size={20} className="mt-0.5 shrink-0 text-gold-700" />
          <p>
            Les administrateurs d’associations et de collectifs gèrent uniquement leur espace. Ils n’ont aucun droit
            sur le reste de l’application. Ils s’engagent à respecter un règlement.
          </p>
        </div>
        <div className="flex gap-3">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-gold-700" />
          <p>
            Avertissement : RRTE et son application ne sont en aucun cas responsables, notamment au regard du droit
            français, du contenu publié par les associations, collectifs et membres, ni des dérives qui pourraient en
            découler. Chaque publication relève de la seule responsabilité de son auteur.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
