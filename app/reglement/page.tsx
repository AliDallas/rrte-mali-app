"use client";

import AppShell from "@/components/AppShell";

const REGLES: [string, string][] = [
  ["Conditions d’adhésion", "Faire partie de la diaspora et être installé au Mali ou y exercer une activité, sans distinction de nationalité, de couleur ou de religion."],
  ["Fiche complète", "Chaque membre remplit sa fiche de renseignements : coordonnées, activité, ancienneté au Mali. Elle reste visible uniquement par les membres."],
  ["Respect des données personnelles", "Les coordonnées des membres ne servent qu’à l’entraide, aux conseils et aux relations professionnelles. Elles ne sont ni revendues, ni diffusées, ni utilisées pour du démarchage non sollicité. Les captures d’écran ou exports de l’annuaire pour les envoyer à des tiers sont interdits."],
  ["Promotion encadrée", "Chacun présente son activité dans les espaces prévus : fiche d’entreprise, recommandations, réponses aux demandes. Pas de messages publicitaires hors de ces espaces, ni de démarchage insistant."],
  ["Contenus utiles et validés", "Les lieux, entreprises et recommandations publiés sont réels, exacts et en lien avec les objectifs du groupe. Les recommandations et les lieux sont validés par un administrateur avant publication."],
  ["Avis honnêtes", "Les avis donnés sur les prestataires et les lieux reposent sur une expérience réelle. Pas de faux avis, pas d’attaques personnelles."],
  ["Participation active", "Chaque membre peut et doit donner son avis, ses suggestions et ses objections. L’application nous appartient à tous."],
  ["Respect mutuel", "Le respect entre membres est une règle de base."],
  ["Ce que l’application n’est pas", "Pas un chat privé. Pas une plateforme politique. Pas de différence de caste ou de statut."],
];

export default function ReglementPage() {
  return (
    <AppShell title="Le groupe RRTE" subtitle="Présentation, accueil et règlement" requireAuth={false}>
      <div className="space-y-4">
        <div className="rounded-xl bg-gold-500/10 p-3 text-[15px] font-semibold">
          Le groupe est réservé aux personnes de la diaspora installées au Mali ou y exerçant une activité.
        </div>
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Présentation et objectif du groupe</h2>
          <p className="text-[15px]">
            RRTE s’adresse aux personnes de la diaspora installées au Mali ou y exerçant une activité.
            Nous sommes de plus en plus nombreux à franchir le pas. Nos parcours, nos visions et nos mentalités sont
            différents, mais nos ambitions restent les mêmes.
          </p>
          <p className="text-[15px]">
            <b>Pourquoi ce groupe ?</b> Pour s’unir autour d’un espace réservé à la communauté, où chacun peut
            recommander ses contacts déjà installés au Mali. Un lieu pour :
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[15px]">
            <li>le business</li>
            <li>l’entraide</li>
            <li>les conseils</li>
            <li>la promotion de nos activités</li>
            <li>les bonnes adresses de loisirs à Bamako</li>
          </ul>
          <p className="text-[15px]">
            Chacun peut présenter ses activités dans les espaces prévus de l’application. On y partage des échanges
            utiles et constructifs.
          </p>
          <p className="text-[15px]">
            Pour aller plus loin, il existe déjà l’Association Repat Mali, l’Union des Ambassadeurs et le CCRM Pôle
            Diaspora, auxquels vous pouvez adhérer.
          </p>
          <p className="font-display text-[15px] font-semibold">
            Se réunir est un début. Rester ensemble est un progrès. Travailler ensemble est une réussite.
          </p>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Bienvenue aux nouveaux membres</h2>
          <p className="text-[15px]">
            <b>Fiche de renseignements.</b> Merci de remplir votre fiche dans l’application. Ces informations restent
            strictement confidentielles et ne sont partagées qu’avec les membres du groupe. Faites l’effort de la
            compléter, c’est dans l’intérêt de tous.
          </p>
          <p className="text-[15px]">
            <b>Règlement.</b> Un règlement garde l’application organisée et constructive. Merci de le
            respecter.
          </p>
          <p className="text-[15px]">
            <b>Suggestions.</b> Vous pouvez proposer vos idées et améliorations. Ce groupe nous appartient à tous.
          </p>
          <p className="text-[15px]">
            <b>Invitations.</b> Vous pouvez en parler à vos contacts repats installés au Mali pour élargir notre réseau : ils s’inscrivent avec le lien de l’application.
          </p>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Règles du groupe</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Réunir · Rester · Travailler ensemble</p>
          <ol className="space-y-3">
            {REGLES.map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gold-100 text-sm font-bold text-gold-700">
                  {i + 1}
                </span>
                <p className="text-[15px]">
                  <b>{t}.</b> {d}
                </p>
              </li>
            ))}
          </ol>
          <div className="rounded-xl bg-brand-red/10 p-3 text-[15px]">
            <b>Sanctions.</b> Les administrateurs ont pour rôle de faire respecter ces règles. Après avertissement, tout
            membre qui ne les respecte pas pourra être retiré du groupe.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
