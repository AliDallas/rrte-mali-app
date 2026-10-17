"use client";

import AppShell from "@/components/AppShell";
import { REGLES } from "@/lib/reglement";

export default function ReglementPage() {
  return (
    <AppShell title="Le groupe RRTE" subtitle="Présentation, accueil et règlement" requireAuth={false}>
      <div className="space-y-4">
        <div className="rounded-xl bg-gold-500/10 p-3 text-[15px] font-semibold">
          Le groupe est réservé aux personnes de la diaspora, expatriés et Maliens de l’extérieur, installées au Mali ou y exerçant une activité.
        </div>
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Présentation et objectif du groupe</h2>
          <p className="text-[15px]">
            RRTE s’adresse aux personnes de la diaspora, expatriés et Maliens de l’extérieur, installées au Mali ou y exerçant une activité.
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

        <section className="card space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Départ et données personnelles</h2>
          <p className="text-[15px]">
            Chacun est libre de quitter le groupe à tout moment, sans avoir à se justifier longuement. Pour cela, utilisez le bouton
            « Quitter le groupe RRTE » dans votre profil : il prépare un message écrit aux administrateurs, avec la raison du départ.
          </p>
          <p className="text-[15px]">
            Sur demande, les administrateurs retirent la personne du groupe WhatsApp, ferment son accès à l’application et suppriment sa fiche
            ainsi que, si elle le souhaite, ses publications, puis lui confirment par message. Vos informations ne sont jamais conservées
            après une demande de suppression.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
