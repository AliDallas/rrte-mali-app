"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Baby, BarChart3, ChevronLeft, ChevronRight, HeartHandshake, LifeBuoy, Wallet, ShieldCheck, Users, CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import {
  CAISSE_VISIBLE_MEMBRES, Cotisant, Cotisation, Depense, MONTANT_MENSUEL, Totaux, anneeCaisse, caisseOuverte, fcfa, statutCotisation,
} from "@/lib/caisse";

function CaisseContenu() {
  const { profile } = useAuth();
  const uid = profile?.uid;
  const admin = profile?.role === "admin";
  const annee = anneeCaisse();
  const [equipe, setEquipe] = useState(false);
  const [totaux, setTotaux] = useState<Totaux | null>(null);
  const [cotisants, setCotisants] = useState<Cotisant[] | null>(null);
  const [depenses, setDepenses] = useState<Depense[] | null>(null);
  const [mesPaiements, setMesPaiements] = useState<Cotisation[]>([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "caisse_tresoriers", uid)).then((s) => setEquipe(s.exists())).catch(() => undefined);
    getDoc(doc(db, "caisse_totaux", "global"))
      .then((s) => setTotaux(s.exists() ? (s.data() as Totaux) : { encaisse: 0, depense: 0 }))
      .catch(() => setErreur("Impossible de lire les comptes de la caisse."));
    getDocs(query(collection(db, "cotisants"), where("annee", "==", annee)))
      .then((r) => setCotisants(r.docs.map((d) => d.data() as Cotisant)))
      .catch(() => setCotisants([]));
    getDocs(query(collection(db, "depenses"), orderBy("date", "desc"), limit(50)))
      .then((r) => setDepenses(r.docs.map((d) => ({ ...(d.data() as Depense), id: d.id })).filter((d) => !d.annulee && (d.statut ?? "validee") === "validee")))
      .catch(() => setDepenses([]));
    getDocs(query(collection(db, "cotisations"), where("uid", "==", uid)))
      .then((r) =>
        setMesPaiements(
          r.docs
            .map((d) => ({ ...(d.data() as Cotisation), id: d.id }))
            .sort((a, b) => (b.creeLe?.seconds ?? 0) - (a.creeLe?.seconds ?? 0))
        )
      )
      .catch(() => undefined);
  }, [uid, annee]);

  const mien = useMemo(() => (cotisants ?? []).find((c) => c.uid === uid), [cotisants, uid]);
  const triCotisants = useMemo(
    () => [...(cotisants ?? [])].sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr")),
    [cotisants]
  );
  const statut = statutCotisation(mien?.moisCouverts ?? 0, annee);
  const ouverte = caisseOuverte();
  const solde = (totaux?.encaisse ?? 0) - (totaux?.depense ?? 0);

  return (
    <AppShell title="Caisse solidaire" subtitle={`Cotisations ${annee}`}>
      <Link href="/accueil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Accueil
      </Link>
      <div className="space-y-4">
        <section className="card space-y-3 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
              <HeartHandshake size={22} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-lg font-bold">À quoi sert la caisse ?</h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
            <li>Financer les activités du groupe RRTE.</li>
            <li>Aider les membres dans le besoin ou en cas d’urgence.</li>
            <li>Marquer les grands moments par un geste symbolique : condoléances, naissance.</li>
          </ul>
          <p className="text-[15px]">
            À l’avenir, nous aimerions aussi soutenir les entreprises du groupe. C’est une réflexion : rien n’est décidé pour l’instant.
          </p>
          <div className="rounded-xl bg-gold-500/10 p-3 text-[15px]">
            <b>Cotisation : {fcfa(MONTANT_MENSUEL)} par mois</b>, soit {fcfa(MONTANT_MENSUEL * 12)} sur l’année civile. Elle commence en janvier 2027.
            Vous choisissez de payer chaque trimestre, chaque semestre ou une fois par an.
          </div>
          <p className="text-[15px]">
            <b>Elle n’est pas obligatoire.</b> Un membre à jour de sa cotisation participe sans frais supplémentaires aux activités financées par la caisse.
          </p>
          <p className="text-[15px]">
            <b>Les aides</b> sont décidées par un comité d’au moins 5 personnes, qui fixe aussi le plafond de chaque aide. Les cotisations ne sont pas remboursables.
          </p>
          <Link href="/caisse/reglement" className="flex items-center gap-1 text-[15px] font-semibold text-gold-700 underline">
            Lire le règlement de la caisse <ChevronRight size={16} />
          </Link>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Ma cotisation</h2>
          <div className="flex items-center gap-3 rounded-xl border border-line p-3">
            {statut.aJour ? <CheckCircle2 className="text-emerald-600" size={22} /> : <Clock className="text-gold-700" size={22} />}
            <p className="text-[15px] font-semibold">{ouverte ? statut.texte : "La caisse ouvre en janvier 2027"}</p>
          </div>
          {ouverte || admin ? (
            <Link href="/caisse/cotiser" className="btn-gold flex items-center justify-center gap-2">
              <Wallet size={18} /> Cotiser et envoyer ma capture {!ouverte && "(test)"}
            </Link>
          ) : (
            <p className="text-sm text-muted">Les paiements seront possibles à partir du 1er janvier 2027. Vous recevrez une annonce dans le groupe.</p>
          )}
          {mesPaiements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Mes paiements envoyés</p>
              {mesPaiements.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{fcfa(p.montant)} · {p.nbMois} mois</p>
                    <p className="text-xs text-muted">{p.rythme} · {p.annee}{(p.statut === "refuse" || p.statut === "annule") && p.motifRefus ? ` · ${p.motifRefus}` : ""}</p>
                  </div>
                  {p.statut === "valide" && (
                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 size={16} /> Validé</span>
                      {p.recu && <Link href={`/caisse/recu/${p.id}`} className="font-semibold text-gold-700 underline">Reçu</Link>}
                    </span>
                  )}
                  {p.statut === "en_attente" && <span className="flex items-center gap-1 text-gold-700"><Clock size={16} /> En attente</span>}
                  {p.statut === "refuse" && <span className="flex items-center gap-1 text-brand-red"><XCircle size={16} /> Refusé</span>}
                  {p.statut === "annule" && <span className="flex items-center gap-1 text-muted"><XCircle size={16} /> Annulé</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3">
          <Link href="/caisse/aide" className="card flex items-center gap-3 border-l-4 border-brand-red p-4">
            <LifeBuoy size={20} className="text-brand-red" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Demander une aide ou signaler une urgence</p>
              <p className="text-xs text-muted">Confidentiel : étudié par le comité d’aide</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
          <Link href="/caisse/vie" className="card flex items-center gap-3 p-4">
            <Baby size={20} className="text-gold-700" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Vie du groupe</p>
              <p className="text-xs text-muted">Signaler une naissance, un décès, un mariage</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        </div>

        {(admin || (CAISSE_VISIBLE_MEMBRES && equipe)) && (
          <Link href="/caisse/gestion" className="card flex items-center gap-3 p-4">
            <ShieldCheck size={20} className="text-gold-700" strokeWidth={1.75} />
            <span className="flex-1 font-semibold">Gestion de la caisse (trésorerie)</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        )}

        <Link href="/caisse/bilan" className="card flex items-center gap-3 p-4">
          <BarChart3 size={20} className="text-gold-700" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Bilan de l’année</p>
            <p className="text-xs text-muted">Compte rendu : encaissé, dépensé, aides, solde</p>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </Link>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Les comptes</h2>
          {erreur && <p className="text-sm text-brand-red">{erreur}</p>}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{totaux ? fcfa(totaux.encaisse) : "…"}</p>
              <p className="text-xs text-muted">Encaissé</p>
            </div>
            <div className="rounded-xl border border-line p-3">
              <p className="font-display text-base font-bold tabular-nums">{totaux ? fcfa(totaux.depense) : "…"}</p>
              <p className="text-xs text-muted">Dépensé</p>
            </div>
            <div className="rounded-xl border-2 border-gold-500 p-3">
              <p className="font-display text-base font-bold tabular-nums">{totaux ? fcfa(solde) : "…"}</p>
              <p className="text-xs text-muted">Solde</p>
            </div>
          </div>
          <p className="pt-2 text-sm font-semibold">Dépenses réalisées</p>
          {depenses === null ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : depenses.length === 0 ? (
            <p className="text-sm text-muted">Aucune dépense pour l’instant.</p>
          ) : (
            <div className="space-y-2">
              {depenses.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{d.libelle}</p>
                    <p className="text-xs text-muted">{new Date(d.date).toLocaleDateString("fr-FR")} · {d.categorie}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{fcfa(d.montant)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gold-700" />
            <h2 className="font-display text-lg font-bold">Membres cotisants {annee}</h2>
            {cotisants && <span className="ml-auto text-sm text-muted">{cotisants.length}</span>}
          </div>
          {cotisants === null ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : triCotisants.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted"><CalendarDays size={16} /> Les premiers cotisants apparaîtront ici dès janvier 2027.</p>
          ) : (
            <ul className="divide-y divide-line">
              {triCotisants.map((c) => {
                const s = statutCotisation(c.moisCouverts, annee);
                return (
                  <li key={c.uid} className="flex items-center gap-3 py-2 text-[15px]">
                    <span className="flex-1">{c.prenom} {c.nom}</span>
                    <span className={`text-xs font-semibold ${s.aJour ? "text-emerald-700" : "text-muted"}`}>{s.aJour ? "À jour" : "En cours"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function CaissePage() {
  return (
    <CaisseAcces>
      <CaisseContenu />
    </CaisseAcces>
  );
}
