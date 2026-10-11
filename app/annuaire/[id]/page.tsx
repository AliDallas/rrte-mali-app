"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Briefcase, ChevronLeft, Mail, MessageCircle, Phone } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import Badges from "@/components/Badges";
import CopierPresentation from "@/components/CopierPresentation";
import { donneesDepuisFiche } from "@/lib/presentation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, chiffres, ficheDepuisDoc, nomComplet } from "@/lib/fiches";
import { Entreprise, entrepriseDepuisDoc } from "@/lib/entreprises";

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
  const [ents, setEnts] = useState<Entreprise[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "absent">("loading");

  useEffect(() => {
    if (!id || profile?.statut !== "actif") return;
    getDoc(doc(db, "fiches", id))
      .then((snap) => {
        if (!snap.exists()) return setState("absent");
        const f = ficheDepuisDoc(snap.id, snap.data());
        setFiche(f);
        setState("ok");
        if (f.uid) {
          getDocs(query(collection(db, "entreprises"), where("ownerUid", "==", f.uid), where("statut", "==", "publie")))
            .then((r) => setEnts(r.docs.map((d) => entrepriseDepuisDoc(d.id, d.data()))))
            .catch(() => undefined);
        }
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
            {!fiche.photo && fiche.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fiche.logo} alt="Logo" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <Avatar prenom={fiche.prenom || fiche.nom} nom={fiche.prenom ? fiche.nom : ""} size={fiche.photo ? 96 : 72} photo={fiche.photo} />
            )}
            <div>
              <p className="font-display text-xl font-bold">{nomComplet(fiche)}</p>
              {(fiche.ville || fiche.pays) && (
                <p className="text-sm text-muted">{[fiche.ville, fiche.pays].filter(Boolean).join(" · ")}</p>
              )}
            </div>
            <Badges admin={!!fiche.admin} />
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fiche.uid ? "bg-emerald-600 text-white" : "bg-gray-200 text-muted"}`}>
              {fiche.uid ? "Compte créé sur l’application" : "Pas encore inscrit sur l’application"}
            </span>
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

          {(fiche.cherche || fiche.propose || fiche.tags.length > 0) && (
            <div className="card space-y-4 p-5">
              <Bloc titre="Je cherche" texte={fiche.cherche} />
              <Bloc titre="Je propose" texte={fiche.propose} />
              {fiche.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {fiche.tags.map((t) => (
                    <span key={t} className="rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card space-y-4 p-5">
            <Bloc titre="Activité" texte={fiche.activite} />
            <Bloc titre="Entreprise ou projet" texte={fiche.presentation} />
            <Bloc titre="Compétences" texte={fiche.competences} />
            <Bloc titre="Au Mali depuis" texte={fiche.anciennete} />
            <Bloc titre="Réseaux" texte={fiche.reseaux} />
            <Bloc titre="Objectif, besoin, centre d’intérêt" texte={fiche.attentes} />
            <Bloc titre="Informations" texte={fiche.info} />
            {!fiche.activite && !fiche.competences && !fiche.anciennete && !fiche.attentes && (
              <p className="text-sm text-muted">Ce membre n’a pas encore complété sa fiche.</p>
            )}
          </div>

          {profile?.role === "admin" && (
            <div className="card space-y-3 p-4">
              <div>
                <p className="text-sm font-semibold">Présentation pour le groupe WhatsApp</p>
                <CopierPresentation donnees={donneesDepuisFiche(fiche)} />
              </div>
              <Link href={`/annuaire/${fiche.id}/modifier`} className="inline-block rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold">
                Corriger la fiche (administrateur)
              </Link>
            </div>
          )}

          {ents.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Ses entreprises</h2>
              {ents.map((e) => (
                <Link key={e.id} href={`/entreprises/${e.id}`} className="card flex items-center gap-4 p-4">
                  {e.logo || e.vignette ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.logo || e.vignette} alt="" className="h-14 w-14 flex-none rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                      <Briefcase size={22} strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{e.nom}</p>
                    <p className="truncate text-sm text-muted">{[e.categorie, e.quartier].filter(Boolean).join(" · ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
