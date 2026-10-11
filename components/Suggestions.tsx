"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Briefcase, MessageCircle, MessageSquare, Phone, Star } from "lucide-react";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { Demande, demandeDepuisDoc, motsCles } from "@/lib/demandes";
import { Entreprise, entrepriseDepuisDoc } from "@/lib/entreprises";
import { Fiche, chiffres, ficheDepuisDoc, nomComplet } from "@/lib/fiches";
import { Prestataire, prestataireDepuisDoc } from "@/lib/prestataires";
import { ecrireCache, lireCache } from "@/lib/cache";

function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function Contact({ tel }: { tel: string }) {
  if (!tel) return null;
  return (
    <div className="flex flex-none gap-1.5">
      <a href={`tel:${tel}`} aria-label="Appeler" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white">
        <Phone size={15} />
      </a>
      <a
        href={`https://wa.me/${chiffres(tel)}?text=${encodeURIComponent("Salam, je te contacte via l’application RRTE.")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-ink"
      >
        <MessageCircle size={15} />
      </a>
    </div>
  );
}

/** Propose, avant toute nouvelle demande, les contacts déjà présents dans l'application. */
export default function Suggestions({ texte, categorie, exclureUid }: { texte: string; categorie: string; exclureUid?: string }) {
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [presta, setPresta] = useState<Prestataire[]>([]);
  const [ents, setEnts] = useState<Entreprise[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);

  useEffect(() => {
    const c = lireCache<Fiche[]>("annuaire");
    if (c) setFiches(c);
    else
      getDocs(collection(db, "fiches"))
        .then((r) => {
          const l = r.docs.map((d) => ficheDepuisDoc(d.id, d.data()));
          ecrireCache("annuaire", l);
          setFiches(l);
        })
        .catch(() => undefined);
    getDocs(collection(db, "prestataires"))
      .then((r) => setPresta(r.docs.map((d) => prestataireDepuisDoc(d.id, d.data())).filter((x) => x.statut === "valide")))
      .catch(() => undefined);
    getDocs(query(collection(db, "entreprises"), where("statut", "==", "publie")))
      .then((r) => setEnts(r.docs.map((d) => entrepriseDepuisDoc(d.id, d.data()))))
      .catch(() => undefined);
    getDocs(query(collection(db, "demandes"), orderBy("createdAt", "desc"), limit(100)))
      .then((r) => setDemandes(r.docs.map((d) => demandeDepuisDoc(d.id, d.data()))))
      .catch(() => undefined);
  }, []);

  const res = useMemo(() => {
    const mots = motsCles(`${texte} ${categorie}`);
    if (mots.length === 0) return null;
    const hit = (t: string) => mots.some((m) => norm(t).includes(m));
    return {
      presta: presta.filter((p) => hit(`${p.metier} ${p.nom} ${p.description}`)).slice(0, 4),
      membres: fiches
        .filter((f) => f.uid !== exclureUid && hit(`${f.activite} ${f.competences} ${f.propose} ${f.tags.join(" ")}`))
        .slice(0, 4),
      ents: ents.filter((e) => hit(`${e.nom} ${e.categorie} ${e.description}`)).slice(0, 4),
      demandes: demandes.filter((d) => d.nbReponses > 0 && hit(`${d.titre} ${d.categorie}`)).slice(0, 3),
    };
  }, [texte, categorie, presta, fiches, ents, demandes, exclureUid]);

  if (!res || (res.presta.length + res.membres.length + res.ents.length + res.demandes.length === 0)) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-gold-500 bg-gold-100/40 p-4">
      <div>
        <p className="font-display text-base font-bold">Déjà dans l’application</p>
        <p className="text-xs text-muted">Ces contacts correspondent peut-être à votre recherche. Vérifiez avant de publier.</p>
      </div>

      {res.presta.map((p) => (
        <div key={p.id} className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <Star size={18} />
          </div>
          <Link href={`/prestataires/${p.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{p.nom}</p>
            <p className="truncate text-xs text-muted">Recommandé · {p.metier}{p.quartier ? ` · ${p.quartier}` : ""}</p>
          </Link>
          <Contact tel={p.tel} />
        </div>
      ))}

      {res.membres.map((f) => (
        <div key={f.id} className="flex items-center gap-3">
          <Avatar prenom={f.prenom || f.nom} nom={f.prenom ? f.nom : ""} size={40} photo={f.photo} />
          <Link href={`/annuaire/${f.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{nomComplet(f)}</p>
            <p className="truncate text-xs text-muted">Membre · {f.propose || f.activite}</p>
          </Link>
          <Contact tel={f.tels[0] ?? ""} />
        </div>
      ))}

      {res.ents.map((e) => (
        <div key={e.id} className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gold-100 text-gold-700">
            <Briefcase size={18} />
          </div>
          <Link href={`/entreprises/${e.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{e.nom}</p>
            <p className="truncate text-xs text-muted">Entreprise · {e.categorie}{e.quartier ? ` · ${e.quartier}` : ""}</p>
          </Link>
          <Contact tel={e.tel} />
        </div>
      ))}

      {res.demandes.length > 0 && (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Demandes semblables déjà répondues</p>
          {res.demandes.map((d) => (
            <Link key={d.id} href={`/demandes/${d.id}`} className="flex items-center gap-2 text-sm">
              <MessageSquare size={14} className="flex-none text-gold-700" />
              <span className="min-w-0 flex-1 truncate">{d.titre}</span>
              <span className="flex-none text-xs text-muted">{d.nbReponses} réponse{d.nbReponses > 1 ? "s" : ""}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
