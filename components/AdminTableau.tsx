"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { BellRing, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import type { ResultatAttente } from "@/lib/enAttente";

export type OngletAdmin = "tableau" | "inscriptions" | "contenus" | "outils";

interface Stat {
  libelle: string;
  n: number | null;
  aide?: string;
}

async function compter(col: string, champ?: string, valeur?: string): Promise<number | null> {
  try {
    const ref = champ ? query(collection(db, col), where(champ, "==", valeur)) : collection(db, col);
    return (await getCountFromServer(ref)).data().count;
  } catch {
    return null;
  }
}

// où se traite chaque rubrique : certaines directement dans l'onglet Inscriptions ou Contenus
const DANS_ADMIN: Record<string, OngletAdmin> = {
  users: "inscriptions",
  entreprises: "contenus",
  prestataires: "contenus",
};

const CONSEIL: Record<string, string> = {
  users: "Valider ou refuser les nouvelles demandes",
  signalements: "Examiner les contenus et membres signalés",
  entreprises: "Publier ou refuser les entreprises proposées",
  prestataires: "Valider les recommandés proposés",
  cotisations: "Valider les captures de paiement de la caisse",
  aides: "Demandes d’aide ou d’urgence : le comité doit voter",
  vie: "Naissances, décès et mariages signalés à valider",
  besoins: "Valider les besoins et urgences",
  structures: "Valider les pages d’associations et de collectifs",
  initiatives: "Valider les initiatives des membres",
  demarches: "Relire et valider les fiches de démarches",
  events: "Valider les événements proposés",
  voyages: "Valider les offres de voyageurs",
  immobilier: "Valider les annonces immobilières",
  restos: "Valider les restaurants proposés",
  fil: "Valider les publications du fil d’actualité",
};

export default function AdminTableau({
  attente,
  chargement,
  onActualiser,
  onAller,
  nbInscrits,
}: {
  attente: { total: number; details: ResultatAttente[] } | null;
  chargement: boolean;
  onActualiser: () => void;
  onAller: (o: OngletAdmin) => void;
  nbInscrits: number;
}) {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    let vivant = true;
    Promise.all([
      compter("users", "statut", "actif"),
      compter("users", "statut", "en_attente"),
      compter("fiches"),
      compter("entreprises", "statut", "publie"),
      compter("prestataires", "statut", "valide"),
      compter("demarches", "statut", "valide"),
    ]).then(([actifs, enAttente, fiches, ent, reco, dem]) => {
      if (!vivant) return;
      setStats([
        { libelle: "Membres actifs", n: actifs, aide: "ont accès à l’application" },
        { libelle: "Demandes en attente", n: enAttente },
        { libelle: "Inscrits sans accès", n: nbInscrits, aide: "WhatsApp seulement" },
        { libelle: "Fiches de l’annuaire", n: fiches },
        { libelle: "Entreprises publiées", n: ent },
        { libelle: "Recommandés", n: reco },
        { libelle: "Démarches validées", n: dem },
      ]);
    });
    return () => {
      vivant = false;
    };
  }, [nbInscrits]);

  const aTraiter = (attente?.details ?? []).filter((d) => d.n > 0);
  const total = attente?.total ?? 0;
  const urgent = aTraiter.filter((d) => d.cle === "users" || d.cle === "signalements");
  const autres = aTraiter.filter((d) => d.cle !== "users" && d.cle !== "signalements");

  function Ligne({ d }: { d: ResultatAttente }) {
    const contenu = (
      <>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{d.libelle}</p>
          <p className="text-xs text-muted">{CONSEIL[d.cle] ?? "Ouvrir la rubrique"}</p>
        </div>
        <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-red px-2 text-sm font-bold text-white">{d.n}</span>
        <ChevronRight size={18} className="text-muted" />
      </>
    );
    const cible = DANS_ADMIN[d.cle];
    return cible ? (
      <button onClick={() => onAller(cible)} className="card flex w-full items-center gap-3 border-l-4 border-brand-red p-4 text-left">
        {contenu}
      </button>
    ) : (
      <Link href={d.href} className="card flex items-center gap-3 border-l-4 border-brand-red p-4">
        {contenu}
      </Link>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`card flex items-center gap-3 p-4 ${total > 0 ? "border-2 border-gold-500" : ""}`}>
        {total > 0 ? <BellRing className="text-gold-600" size={26} strokeWidth={1.75} /> : <CheckCircle2 className="text-emerald-600" size={26} />}
        <div className="flex-1">
          <p className="font-display text-lg font-bold">
            {chargement && !attente ? "Vérification…" : total === 0 ? "Tout est traité" : `${total} élément${total > 1 ? "s" : ""} à traiter`}
          </p>
          <p className="text-xs text-muted">Mis à jour à chaque ouverture et toutes les minutes.</p>
        </div>
        <button onClick={onActualiser} aria-label="Actualiser" className="rounded-full p-2 text-muted">
          <RefreshCw size={16} className={chargement ? "animate-spin" : ""} />
        </button>
      </div>

      {urgent.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-base font-bold">Priorité</h2>
          {urgent.map((d) => (
            <Ligne key={d.cle} d={d} />
          ))}
        </section>
      )}

      {autres.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-display text-base font-bold">Contenus à valider</h2>
          {autres.map((d) => (
            <Ligne key={d.cle} d={d} />
          ))}
        </section>
      )}

      {nbInscrits > 0 && (
        <button onClick={() => onAller("inscriptions")} className="card flex w-full items-center gap-3 p-4 text-left">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Inscrits sans accès à l’application</p>
            <p className="text-xs text-muted">Validés pour WhatsApp : ouvrir l’accès un par un ou en une fois</p>
          </div>
          <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-gold-500 px-2 text-sm font-bold text-ink">{nbInscrits}</span>
          <ChevronRight size={18} className="text-muted" />
        </button>
      )}

      <section className="space-y-2">
        <h2 className="font-display text-base font-bold">L’application en chiffres</h2>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.libelle} className="card p-4">
              <p className="font-display text-2xl font-bold tabular-nums">{s.n === null ? "–" : s.n}</p>
              <p className="text-sm font-medium">{s.libelle}</p>
              {s.aide && <p className="text-xs text-muted">{s.aide}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
