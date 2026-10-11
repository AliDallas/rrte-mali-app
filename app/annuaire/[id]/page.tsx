"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, chiffres, ficheDepuisDoc, nomComplet } from "@/lib/fiches";

function Bloc({ titre, texte }: { titre: string; texte: string }) {
  if (!texte) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{titre}</p>
      <p className="mt-1 text-[15px]">{texte}</p>
    </div>
  );
}

export default function FicheDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { profile } = useAuth();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "fiches", id))
      .then((snap) => {
        if (!snap.exists()) return setState("absent");
        setFiche(ficheDepuisDoc(snap.id, snap.data()));
        setState("ok");
      })
      .catch(() => setState("absent"));
  }, [id, profile]);

  return (
    <AppShell title={fiche ? nomComplet(fiche) : "Membre"} subtitle={fiche?.activite || "Fiche membre"}>
      <Link href="/annuaire" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Membres
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absent" && <p className="card p-6 text-center text-muted">Fiche introuvable.</p>}
      {state === "ok" && fiche && (
        <div className="space-y-4">
          <div className="card flex flex-col items-center gap-3 p-6 text-center">
            <Avatar prenom={fiche.prenom || fiche.nom} nom={fiche.prenom ? fiche.nom : ""} size={72} />
            <div>
              <p className="font-display text-xl font-bold">{nomComplet(fiche)}</p>
              {fiche.ville && <p className="text-sm text-muted">{fiche.ville}</p>}
            </div>
            {fiche.aConfirmer && (
              <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
                Profil à compléter par le membre
              </span>
            )}
          </div>

          <div className="card divide-y divide-line">
            {fiche.tels.map((t) => (
              <div key={t} className="flex items-center gap-3 px-4 py-3">
                <Phone size={18} strokeWidth={1.75} className="text-gold-600" />
                <span className="flex-1 text-[15px]">{t}</span>
                <a
                  href={`tel:${t}`}
                  className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold"
                >
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${chiffres(t)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
                >
                  <MessageCircle size={17} />
                </a>
              </div>
            ))}
            {fiche.email && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Mail size={18} strokeWidth={1.75} className="text-gold-600" />
                <a href={`mailto:${fiche.email}`} className="flex-1 break-all text-[15px]">
                  {fiche.email}
                </a>
              </div>
            )}
          </div>

          <div className="card space-y-4 p-5">
            <Bloc titre="Activité" texte={fiche.activite} />
            <Bloc titre="Compétences" texte={fiche.competences} />
            <Bloc titre="Au Mali depuis" texte={fiche.anciennete} />
            <Bloc titre="Réseaux" texte={fiche.reseaux} />
            <Bloc titre="Attentes du groupe" texte={fiche.attentes} />
            <Bloc titre="Informations" texte={fiche.info} />
            {!fiche.activite && !fiche.competences && !fiche.anciennete && !fiche.attentes && (
              <p className="text-sm text-muted">Ce membre n’a pas encore complété sa fiche.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
