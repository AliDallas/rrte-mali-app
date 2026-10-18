"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import { EMAIL_GROUPE } from "@/lib/contact";

const MISE_A_JOUR = "octobre 2026";

export default function ConfidentialitePage() {
  return (
    <AppShell title="Confidentialité" subtitle="Vos données dans l’application RRTE" requireAuth={false}>
      <Link href="/reglement" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Le groupe et son règlement
      </Link>
      <div className="space-y-4">
        <div className="rounded-xl bg-gold-500/10 p-3 text-[15px]">
          Cette page explique simplement quelles informations l’application RRTE conserve sur vous, pourquoi, qui peut les voir et comment les faire corriger ou effacer.
          Dernière mise à jour : {MISE_A_JOUR}.
        </div>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Qui gère l’application ?</h2>
          <p className="text-[15px]">
            L’application est gérée par les administrateurs du collectif RRTE (Réunir Rester Travailler Ensemble), un groupe de personnes de la diaspora, expatriés et Maliens de l’extérieur
            installés au Mali ou y exerçant une activité. RRTE n’est pas une association déclarée. Contact : {EMAIL_GROUPE}.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Les informations que nous conservons</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
            <li><b>Votre fiche</b> : nom, prénom, téléphone, e-mail, ville ou quartier, année d’arrivée au Mali, activité, compétences, présentation, photo ou logo, liens vers vos réseaux.</li>
            <li><b>Vos contenus</b> : entreprises, recommandations, demandes, annonces (voyages, immobilier, loisirs, restaurants), publications du fil, avis, réponses aux sondages et offres de covoiturage.</li>
            <li><b>La caisse solidaire</b> (si vous y participez) : vos paiements, avec la capture d’écran et le numéro de transaction que vous envoyez, vos demandes d’aide et les événements de la vie du groupe que vous signalez.</li>
            <li><b>Votre activité</b> : la date de votre dernière connexion à l’application.</li>
            <li><b>Votre acceptation du règlement</b> et la date à laquelle vous l’avez acceptée.</li>
          </ul>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Pourquoi ?</h2>
          <p className="text-[15px]">
            Uniquement pour faire fonctionner le groupe : vous présenter aux autres membres, vous mettre en relation, valider les inscriptions et les publications, organiser les événements,
            gérer la caisse solidaire et protéger la communauté contre les abus. Nous ne vendons aucune donnée et nous n’affichons aucune publicité.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Qui peut voir quoi ?</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
            <li><b>Les autres membres</b> voient votre fiche et vos publications validées. L’annuaire n’est accessible qu’aux membres connectés.</li>
            <li><b>Les administrateurs</b> voient en plus les inscriptions, les signalements et la date de votre dernière connexion.</li>
            <li><b>L’équipe de la caisse</b> (trésorier, contrôleur) voit les paiements, les captures et le journal. Le comité d’aide voit les demandes d’aide, qui restent confidentielles.</li>
            <li>Les informations de la caisse visibles de tous les membres sont : la liste des cotisants, le solde et la liste des dépenses. Les montants individuels et les captures ne sont pas montrés.</li>
            <li>Les démarches de la rubrique « Démarches & papiers » sont des informations générales. Ne publiez jamais de pièce d’identité ni de document personnel dans l’application.</li>
          </ul>
          <p className="text-[15px]">
            Il est interdit de copier, capturer ou transmettre à des tiers l’annuaire ou les coordonnées des membres. Cette règle protège chacun d’entre nous.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Où sont conservées les données ?</h2>
          <p className="text-[15px]">
            Les données sont hébergées chez deux prestataires techniques : Google (service Firebase, serveurs en Europe) pour la base de données et la connexion, et Vercel pour l’affichage de l’application.
            Elles sont donc stockées en dehors du Mali. Ces prestataires appliquent leurs propres mesures de sécurité. Les liens et paiements vers d’autres services (WhatsApp, Orange Money, TikTok, Facebook…)
            relèvent des règles de ces services.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Combien de temps ?</h2>
          <p className="text-[15px]">
            Votre fiche et vos contenus sont conservés tant que vous êtes membre. Si vous quittez le groupe, vos données personnelles sont supprimées par un administrateur, à votre demande.
            Les écritures comptables de la caisse (montants, reçus numérotés, journal) sont conservées pour la transparence des comptes, mais sans autre information vous concernant que ce qui est strictement nécessaire.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Vos droits</h2>
          <p className="text-[15px]">
            Vous pouvez à tout moment consulter et corriger votre fiche dans <b>Profil → Modifier ma fiche</b>, supprimer vos propres publications, et demander la suppression complète de votre fiche et de vos données avec
            <b> Profil → Quitter le groupe RRTE</b>. Vous pouvez aussi nous écrire à {EMAIL_GROUPE} pour toute question sur vos données. Nous nous engageons à répondre rapidement.
          </p>
          <p className="text-[15px]">
            La protection des données personnelles est encadrée au Mali par la loi n° 2013-015 du 21 mai 2013 et par l’Autorité de protection des données à caractère personnel (APDP), auprès de laquelle vous pouvez vous renseigner.
          </p>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display text-lg font-bold">Sécurité et bonnes pratiques</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px]">
            <li>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs, et ne le partagez jamais.</li>
            <li>Les administrateurs ne vous demanderont jamais votre mot de passe.</li>
            <li>En cas de problème ou de comportement abusif, utilisez le bouton « Signaler ».</li>
          </ul>
        </section>

        <p className="text-xs text-muted">
          RRTE ne peut pas garantir une sécurité absolue, aucun service en ligne ne le peut, mais fait le nécessaire pour protéger vos informations. Ce texte pourra évoluer ; la date de mise à jour est indiquée en haut de la page.
        </p>
      </div>
    </AppShell>
  );
}
