"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { MONTANT_MENSUEL, fcfa } from "@/lib/caisse";

const ARTICLES: [string, string[]][] = [
  [
    "Objet de la caisse",
    [
      "La caisse solidaire RRTE sert à financer les activités du groupe, à aider les membres dans le besoin ou en cas d’urgence, et à marquer les grands moments de la vie des membres par un geste symbolique (condoléances, naissance).",
      "Elle ne sert à rien d’autre. Les dépenses de fonctionnement du groupe (application, hébergement, nom de domaine) peuvent y être imputées et sont visibles de tous.",
    ],
  ],
  [
    "Cotisation",
    [
      `La cotisation est de ${fcfa(MONTANT_MENSUEL)} par mois, soit ${fcfa(MONTANT_MENSUEL * 12)} par année civile (de janvier à décembre). Elle commence en janvier 2027.`,
      "Elle est volontaire. Chaque membre choisit son rythme : chaque trimestre (6 000 FCFA), chaque semestre (12 000 FCFA) ou une fois par an (24 000 FCFA).",
    ],
  ],
  [
    "Avantage pour les cotisants",
    ["Un membre à jour de sa cotisation participe aux activités financées par la caisse sans payer de participation supplémentaire."],
  ],
  [
    "Pas de remboursement",
    [
      "Les cotisations versées ne sont pas remboursables, y compris si le membre quitte le groupe ou en est retiré. Chaque cotisation est un don à la solidarité du groupe.",
    ],
  ],
  [
    "Paiement et preuve",
    [
      "Le paiement se fait sur le numéro dédié à la caisse. Le membre envoie la capture d’écran de son paiement dans l’application. Le trésorier vérifie, puis valide : le statut du membre se met à jour.",
      "L’application ne fait pas elle-même le paiement : elle sert à le suivre.",
    ],
  ],
  [
    "Gestion de la caisse",
    [
      "La caisse est tenue par deux personnes nommées par les administrateurs : un trésorier, qui valide les paiements et note les dépenses, et un contrôleur, qui consulte les comptes et peut vérifier chaque opération.",
      "Chaque dépense est notée avec sa date, son montant, sa catégorie et, dans la mesure du possible, un justificatif.",
    ],
  ],
  [
    "Les aides",
    [
      "Les aides sont décidées par un comité d’au moins 5 personnes. Le comité décide de l’octroi de chaque aide et fixe le plafond. Ses décisions sont prises collectivement, à la majorité de ses membres.",
      "L’aide est un geste de solidarité du groupe, dans la limite des moyens de la caisse. Ce n’est pas un droit et elle n’est pas garantie.",
    ],
  ],
  [
    "Transparence",
    [
      "Tous les membres voient les montants encaissés et dépensés, le solde, la liste des dépenses et la liste des membres cotisants. La liste de ceux qui n’ont pas cotisé n’est connue que de l’équipe de la caisse et des administrateurs.",
      "Les captures d’écran des paiements et les justificatifs ne sont visibles que de l’équipe de la caisse et des administrateurs. Ils sont conservés pour la comptabilité de la caisse.",
      "Un compte rendu est présenté aux membres une fois par an. Il est publié dans l’application.",
    ],
  ],
  [
    "Évolutions",
    [
      "Les administrateurs peuvent faire évoluer ce règlement. Tout changement est annoncé aux membres.",
      "Le groupe réfléchit à une aide aux entreprises de ses membres. Ce n’est pas décidé : si le projet avance, il fera l’objet d’un règlement séparé, annoncé à tous.",
    ],
  ],
];

function ReglementContenu() {
  return (
    <AppShell title="Règlement de la caisse" subtitle="Caisse solidaire RRTE">
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      <div className="card space-y-4 p-5">
        <ol className="space-y-4">
          {ARTICLES.map(([titre, paragraphes], i) => (
            <li key={titre} className="flex gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">{i + 1}</span>
              <div className="space-y-2">
                <p className="font-display text-[15px] font-bold">{titre}</p>
                {paragraphes.map((p) => (
                  <p key={p} className="text-[15px]">{p}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}

export default function ReglementCaissePage() {
  return (
    <CaisseAcces>
      <ReglementContenu />
    </CaisseAcces>
  );
}
