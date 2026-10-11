"use client";

import AppShell from "@/components/AppShell";

const REGLES: [string, string][] = [
  ["Conditions d’adhésion", "Avoir quitté la France pour s’installer au Mali ou y exercer une activité une partie de l’année, sans distinction de couleur ou de religion."],
  ["Présentation obligatoire", "Chaque membre doit se présenter en remplissant sa fiche de renseignements dans l’application : nom, numéro de téléphone, ancienneté au Mali."],
  ["Respect des informations personnelles", "Les données des membres ne doivent pas être utilisées à d’autres fins que celles du groupe : entraide, conseils, relations professionnelles."],
  ["Publicité et promotion", "Pas de publicité spontanée. Une tribune sera accordée à chacun pour présenter son activité de manière organisée."],
  ["Contenu publié", "Pas de photos ou de vidéos sans rapport avec les objectifs du groupe."],
  ["Participation active", "Chaque membre peut et doit donner son avis, ses suggestions et ses objections. Ce groupe nous appartient à tous."],
  ["Respect mutuel", "Le respect entre membres est une règle de base."],
  ["Objectifs à garder en tête", "Toujours rester aligné avec la vision et la mission du groupe."],
  ["Ce que le groupe n’est pas", "Pas un chat privé. Pas une plateforme politique. Pas de différence de caste ou de statut."],
];

export default function ReglementPage() {
  return (
    <AppShell title="Le groupe RRTE" subtitle="Présentation, accueil et règlement" requireAuth={false}>
      <div className="space-y-4">
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Présentation et objectif du groupe</h2>
          <p className="text-[15px]">
            Ce groupe s’adresse à tous ceux qui ont quitté la France pour s’installer au Mali ou y exercent une activité.
            Nous sommes de plus en plus nombreux à franchir le pas. Nos parcours, nos visions et nos mentalités sont
            différents, mais nos ambitions restent les mêmes.
          </p>
          <p className="text-[15px]">
            <b>Pourquoi ce groupe ?</b> Pour s’unir autour d’un espace exclusivement réservé aux repats, où chacun peut
            ajouter ses contacts déjà installés au Mali. Un lieu pour :
          </p>
          <ul className="list-disc space-y-1 pl-5 text-[15px]">
            <li>le business</li>
            <li>l’entraide</li>
            <li>les conseils</li>
            <li>la promotion de nos activités</li>
          </ul>
          <p className="text-[15px]">
            Ce groupe n’est pas fait pour les vidéos inutiles, les audios sans lien ou les ventes personnelles. On y
            partage uniquement des échanges professionnels et constructifs.
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
            <b>Règlement.</b> Un règlement a été mis en place pour garder le groupe organisé et constructif. Merci de le
            respecter.
          </p>
          <p className="text-[15px]">
            <b>Suggestions.</b> Vous pouvez proposer vos idées et améliorations. Ce groupe nous appartient à tous.
          </p>
          <p className="text-[15px]">
            <b>Invitations.</b> Vous pouvez en parler à vos contacts repats installés au Mali pour élargir notre réseau.
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
