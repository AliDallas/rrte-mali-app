"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Check, ChevronLeft, Copy, MessageCircle, Printer } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import Logo from "@/components/Logo";
import { db } from "@/lib/firebase";
import { Cotisation, MOIS, fcfa } from "@/lib/caisse";

function Contenu() {
  const params = useParams<{ id: string }>();
  const [c, setC] = useState<Cotisation | null | undefined>(undefined);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    getDoc(doc(db, "cotisations", params.id))
      .then((s) => setC(s.exists() && s.data().statut === "valide" ? ({ ...(s.data() as Cotisation), id: s.id }) : null))
      .catch(() => setC(null));
  }, [params?.id]);

  const date = c?.valideLe ? new Date(c.valideLe.seconds * 1000) : null;
  const dateTexte = date ? `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}` : "";
  const jusqua = c?.moisApres ? (c.moisApres >= 12 ? `fin décembre ${c.annee}` : `fin ${MOIS[c.moisApres - 1]} ${c.annee}`) : "";
  const texte = c
    ? `Reçu RRTE n° ${c.recu}\nCaisse solidaire RRTE\n\nReçu de : ${c.nom}\nMontant : ${fcfa(c.montant)}\nObjet : cotisation ${c.annee}, ${c.nbMois} mois${jusqua ? ` (couvert jusqu’à ${jusqua})` : ""}\nValidé le : ${dateTexte}\n\nMerci pour votre solidarité.`
    : "";

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* ignoré */
    }
  }

  return (
    <AppShell title="Reçu de cotisation" subtitle="Caisse solidaire">
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted print:hidden">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      {c === undefined ? (
        <p className="text-muted">Chargement…</p>
      ) : c === null ? (
        <p className="card p-6 text-center text-muted">Reçu introuvable.</p>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-4 border-2 border-gold-500 p-6">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <p className="font-display text-lg font-bold">Reçu de cotisation</p>
                <p className="text-sm text-muted">Caisse solidaire RRTE</p>
              </div>
            </div>
            <p className="font-display text-2xl font-bold tabular-nums">{c.recu}</p>
            <dl className="space-y-2 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">Reçu de</dt><dd className="text-right font-semibold">{c.nom}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Montant</dt><dd className="font-semibold tabular-nums">{fcfa(c.montant)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Objet</dt><dd className="text-right">Cotisation {c.annee} · {c.nbMois} mois</dd></div>
              {jusqua && <div className="flex justify-between gap-4"><dt className="text-muted">Couvert jusqu’à</dt><dd className="text-right">{jusqua}</dd></div>}
              {dateTexte && <div className="flex justify-between gap-4"><dt className="text-muted">Validé le</dt><dd>{dateTexte}</dd></div>}
            </dl>
            <p className="text-xs text-muted">Reçu établi par la trésorerie de la caisse solidaire RRTE. Les cotisations ne sont pas remboursables.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 print:hidden">
            <a href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center justify-center gap-2">
              <MessageCircle size={18} /> Partager sur WhatsApp
            </a>
            <button onClick={copier} className="btn-outline flex items-center justify-center gap-2">
              {copie ? <Check size={18} /> : <Copy size={18} />} {copie ? "Copié" : "Copier le texte"}
            </button>
            <button onClick={() => window.print()} className="btn-outline flex items-center justify-center gap-2">
              <Printer size={18} /> Imprimer ou enregistrer en PDF
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function RecuPage() {
  return (
    <CaisseAcces>
      <Contenu />
    </CaisseAcces>
  );
}
