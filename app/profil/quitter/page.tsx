"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Mail } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { lienMailDepart, lienWhatsApp } from "@/lib/contact";

const CAUSES = [
  "Je n’ai plus le temps",
  "Je quitte le Mali",
  "Le groupe ne répond pas à mes attentes",
  "Trop de messages ou de notifications",
  "Un désaccord avec le fonctionnement du groupe",
  "Autre raison",
];

export default function QuitterPage() {
  const { profile } = useAuth();
  const [cause, setCause] = useState("");
  const [precision, setPrecision] = useState("");
  const [fiche, setFiche] = useState(true);
  const [contenus, setContenus] = useState(false);

  const message = useMemo(() => {
    const nom = [profile?.prenom, profile?.nom].filter(Boolean).join(" ");
    return [
      "Bonjour,",
      "",
      `Je souhaite quitter le groupe RRTE${nom ? ` (${nom})` : ""}.`,
      `Raison : ${cause || "non précisée"}${precision.trim() ? ` : ${precision.trim()}` : ""}`,
      fiche ? "Merci de supprimer ma fiche de l’annuaire et mon accès à l’application." : "Je souhaite garder ma fiche dans l’annuaire.",
      contenus ? "Merci de retirer aussi mes publications (entreprises, recommandations, démarches, initiatives)." : "",
      "",
      "Merci.",
    ]
      .filter((l, i, t) => l !== "" || (t[i - 1] !== "" && i < t.length - 1))
      .join("\n");
  }, [profile, cause, precision, fiche, contenus]);

  const pret = cause !== "";

  return (
    <AppShell title="Quitter le groupe" subtitle="Demande de départ et retrait de vos données">
      <Link href="/profil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Mon profil
      </Link>
      <div className="space-y-4">
        <div className="rounded-xl bg-gold-500/10 p-3 text-[15px]">
          Le départ n’est pas automatique : vous envoyez une demande écrite aux administrateurs, qui vous retirent du groupe WhatsApp,
          ferment votre accès et suppriment votre fiche, puis vous confirment par message.
        </div>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Pourquoi souhaitez-vous partir ?</h2>
          <div className="space-y-2">
            {CAUSES.map((c) => (
              <label key={c} className="flex cursor-pointer items-center gap-3 text-[15px]">
                <input type="radio" name="cause" checked={cause === c} onChange={() => setCause(c)} className="h-4 w-4 accent-[#B8860B]" />
                {c}
              </label>
            ))}
          </div>
          <textarea
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Précisions (facultatif) : cela nous aide à améliorer le groupe"
            className="w-full rounded-xl border border-line bg-transparent p-3 text-[15px]"
          />
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Vos données</h2>
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input type="checkbox" checked={fiche} onChange={(e) => setFiche(e.target.checked)} className="mt-1 h-4 w-4 accent-[#B8860B]" />
            Supprimer ma fiche de l’annuaire et mon accès à l’application
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input type="checkbox" checked={contenus} onChange={(e) => setContenus(e.target.checked)} className="mt-1 h-4 w-4 accent-[#B8860B]" />
            Retirer aussi mes publications (entreprises, recommandations, démarches, initiatives)
          </label>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Votre message</h2>
          <pre className="whitespace-pre-wrap rounded-xl bg-gold-500/10 p-3 font-sans text-sm">{message}</pre>
          <a
            href={pret ? lienWhatsApp(message) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!pret}
            className={`btn-gold flex items-center justify-center gap-2 ${pret ? "" : "pointer-events-none opacity-40"}`}
          >
            <MessageCircle size={18} /> Envoyer par WhatsApp
          </a>
          <a
            href={pret ? lienMailDepart(message) : undefined}
            aria-disabled={!pret}
            className={`btn-outline flex items-center justify-center gap-2 ${pret ? "" : "pointer-events-none opacity-40"}`}
          >
            <Mail size={18} /> Envoyer par e-mail
          </a>
          {!pret && <p className="text-xs text-muted">Choisissez d’abord la raison du départ.</p>}
          <p className="text-xs text-muted">
            WhatsApp s’ouvre avec le message prêt à envoyer : appuyez sur « Envoyer ». Tant que vous n’avez pas envoyé le message, rien n’est demandé.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
