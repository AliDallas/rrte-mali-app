// Cinquième lot de fiches : conduite et véhicules, association, naissance et jugement supplétif, mariage avec un Français,
// sécurité sociale, séjour et travail des étrangers. Sources consultées le 17/10/2026 : portail officiel demarchesadministratives.gouv.ml,
// ml.diplomatie.gouv.fr, CLEISS (régime malien de sécurité sociale), AfriCarrieres (édition février 2026), document ONG « Un enfant par la main ».
// Importées « en attente » pour relecture. Les informations non trouvées sont écrites « non précisé » : ne rien inventer, confirmer sur place.

import type { DemarcheInitiale } from "./demarchesInitiales";

const V = "2026-10-17";
const CAT_PERMIS = "Permis & carte grise";
const CAT_ENT = "Création d’entreprise & foncier";
const CAT_ETAT = "État civil (naissance, actes, livret)";
const CAT_MARIAGE = "Mariage & divorce";
const CAT_IMPOTS = "Impôts, douane & retraite";
const CAT_VISA = "Visas & titres de séjour";
const PORTAIL = "https://demarchesadministratives.gouv.ml";
const NOTE_PORTAIL = "Montants et délais issus du portail officiel du Mali : ils peuvent différer selon le guichet, à confirmer sur place.";
const DNT = "Direction nationale des Transports, Ministère de l’Équipement et des Transports, Darsalam. Tél. 20 22 41 12 / 20 22 64 63.";

function mk(d: Omit<DemarcheInitiale, "etapes" | "pieces" | "verifieLe"> & { etapes: string[]; pieces: string[]; verifieLe?: string }): DemarcheInitiale {
  return { ...d, etapes: d.etapes.join("\n"), pieces: d.pieces.join("\n"), verifieLe: d.verifieLe ?? V };
}

export const DEMARCHES_INITIALES_5: DemarcheInitiale[] = [
  mk({
    id: "init5-ml-permis-renouvellement",
    titre: "Renouveler son permis de conduire (catégories C, D, E)",
    categorie: CAT_PERMIS,
    lieu: "Mali",
    resume: "Le renouvellement concerne les permis des catégories C, D et E (poids lourds, transport). Pour les catégories A et B, il n’est nécessaire que lorsque le texte l’exige. Délai moyen : un mois.",
    etapes: [
      "Déposer le dossier à la section permis de la Direction régionale des transports : enregistrement, puis paiement à la caisse.",
      "Le dossier revient à la section, puis passe au chef de division pour visa.",
      "Saisie informatique, validation et impression du permis.",
      "Visa du chef de division et signature du directeur régional ; enregistrement et contrôle à la Direction nationale, qui signe si le dossier est conforme.",
      "Retrait par l’intéressé ou son mandataire à la section permis de la direction régionale.",
    ],
    pieces: [
      "Ancien permis (expiré, illisible ou déchiré)",
      "Demande timbrée à 200 FCFA",
      "Certificat de résidence de la police, de la gendarmerie ou de la mairie",
      "4 photos d’identité (couleur de préférence)",
      "Timbre fiscal de 3 750 FCFA",
      "Catégories C, D, E : fiche de visite médicale",
    ],
    cout: "Frais Direction nationale 3 000 FCFA ; ANASER 2 000 FCFA ; visite médicale 6 000 FCFA (soit 11 000 FCFA) + timbres 200 et 3 750 FCFA",
    delai: "Environ un mois en moyenne",
    adresse: `Direction régionale des transports, section permis de conduire. ${DNT}\nLa périodicité du renouvellement est exposée de façon peu claire sur le portail (tous les 5 ans, puis plus souvent avec l’âge) : confirmer au guichet. Formulaire téléchargeable sur le portail. ${NOTE_PORTAIL}`,
    liens: [PORTAIL + "/permis-de-conduire-renouvellement/"],
  }),
  mk({
    id: "init5-ml-permis-duplicata",
    titre: "Permis de conduire perdu : obtenir un duplicata",
    categorie: CAT_PERMIS,
    lieu: "Mali",
    resume: "En cas de perte, la demande de duplicata se dépose à la section permis de la direction régionale ou de la subdivision, avec un certificat de perte de la police ou de la mairie indiquant le numéro du permis. Délai moyen : un mois.",
    etapes: [
      "Déposer le dossier à la section permis : vérification de la complétude et de la conformité.",
      "Enregistrement, puis paiement des frais à la caisse.",
      "Visa du chef de division, saisie et validation informatique, impression du duplicata.",
      "Signature du directeur régional ; enregistrement et contrôle à la Direction nationale (comparaison avec le permis d’origine), puis signature.",
      "Retrait par l’intéressé ou son mandataire à la section où le dossier a été déposé.",
    ],
    pieces: [
      "Demande timbrée à 200 FCFA (le prix peut évoluer)",
      "Certificat de perte délivré par la police ou la mairie, avec le numéro du permis",
      "Certificat de résidence délivré par la police",
      "4 photos d’identité",
      "Timbre fiscal de 3 750 FCFA, payé sur place",
      "Catégories C, D, E : fiche de visite médicale",
    ],
    cout: "Direction nationale 3 000 FCFA ; ANASER 2 000 FCFA ; visite médicale 6 000 FCFA ; timbres 200 et 3 750 FCFA",
    delai: "Environ un mois en moyenne",
    adresse: `Direction régionale des transports ou subdivision (section permis). ${DNT} ${NOTE_PORTAIL}`,
    liens: [PORTAIL + "/permis-de-conduire-duplicata/"],
  }),
  mk({
    id: "init5-ml-vignette",
    titre: "Vignette automobile : où et quand la payer, tarifs par puissance",
    categorie: CAT_PERMIS,
    lieu: "Mali",
    resume: "La vignette se paie aux guichets des impôts, en principe du 1er janvier au 31 mars de chaque année, sur présentation de la carte grise. Elle se colle sur le pare-brise. Après les délais, une pénalité de 100 % s’applique.",
    etapes: [
      "Se présenter aux guichets des impôts, en général entre le 1er janvier et le 31 mars de l’année en cours, avec la carte grise (première immatriculation : la référence est la date de délivrance de la carte grise).",
      "Payer le montant correspondant à la puissance fiscale ; on reçoit la vignette (à coller sur le pare-brise) et un reçu.",
      "Un paiement effectué à partir du 1er octobre est à demi-tarif.",
      "Passé les délais : pénalité de 100 %.",
    ],
    pieces: ["Carte grise (les autres pièces ne sont pas lisibles dans la source)", "Conserver le reçu : il est exigé pour la carte nationale de transport et lors des contrôles"],
    cout: "2 à 6 CV : 7 000 FCFA ; 7 à 8 CV : 13 000 ; 10 à 14 CV : 32 000 ; 15 à 19 CV : 50 000 ; 20 CV et plus : 75 000 FCFA",
    delai: "Non précisé ; période de paiement du 1er janvier au 31 mars",
    adresse: "Guichets des impôts (adresse non précisée). Page du portail incomplète : confirmer les tarifs aux impôts. " + NOTE_PORTAIL,
    liens: [PORTAIL + "/acquisition-vignette/"],
  }),
  mk({
    id: "init5-ml-constat-accident",
    titre: "Accident de la circulation : le constat et la suite",
    categorie: CAT_PERMIS,
    lieu: "Mali",
    resume: "Un ou les deux conducteurs préviennent la division « Voie publique » du commissariat ou de la brigade de gendarmerie. Une équipe se déplace et établit le procès-verbal. Gratuit ; délai indiqué : une semaine.",
    etapes: [
      "Prévenir la division « Voie publique » du commissariat ou de la brigade de gendarmerie. En cas de blessé, un examen médical est fait en premier.",
      "Une équipe se rend sur place, recueille les déclarations, examine les véhicules et les papiers.",
      "Le procès-verbal est établi, enregistré et transmis au commissaire, puis au juge.",
      "Si les véhicules sont assurés, le procès-verbal est transmis aux assureurs ; les conducteurs ne sont pas gardés à vue quels que soient les dégâts.",
      "S’il y a un blessé, les poursuites continuent même en cas d’accord entre les parties (coups et blessures involontaires) : le permis peut être scellé et le dossier transmis au parquet.",
      "Accident léger sans blessé ni dégât important : constaté sur place avec remise d’un reçu.",
    ],
    pieces: ["Permis de conduire", "Carte grise", "Vignette", "Assurance", "Visite technique en cours de validité", "Cartes d’identité des deux parties"],
    cout: "Gratuit",
    delai: "Une semaine",
    adresse: "Division Voie publique d’un commissariat de police ou d’une brigade de gendarmerie.\nRéférences : article 210 du Code pénal ; tableau des infractions courantes n° 0107/DSP du 13/06/2007. " + NOTE_PORTAIL,
    liens: [PORTAIL + "/constat-daccident-de-la-circulation/"],
  }),
  mk({
    id: "init5-ml-carte-transport",
    titre: "Carte nationale de transport (véhicule professionnel)",
    categorie: CAT_PERMIS,
    lieu: "Mali",
    resume: "La carte nationale de transport se demande à la section « carte des transports » de la Direction régionale des transports. Délai annoncé : 24 heures.",
    etapes: [
      "Retirer le formulaire à la DRTTF, le faire timbrer à 200 FCFA, puis se présenter à la section carte des transports.",
      "Paiement, puis retour du dossier à la section pour enregistrement et numérotation.",
      "Frappe de la carte au Secrétariat général, contrôle à la division, paraphe du chef de division et signature du directeur régional ou de son délégué.",
      "Retrait de la carte par l’usager ou son mandataire à la section.",
    ],
    pieces: [
      "Formulaire de demande de la DRTTF, timbré à 200 FCFA",
      "Photocopie de la carte grise",
      "Photocopie de la visite technique en cours de validité",
      "Photocopie de l’assurance nationale en cours de validité",
      "Reçu de la vignette de l’année en cours",
    ],
    cout: "Timbre fiscal 2 000 FCFA ; redevance DNTTMF variable selon le véhicule (montant non précisé)",
    delai: "24 heures",
    adresse: `Section carte des transports, Direction régionale des transports. ${DNT} Formulaire PDF téléchargeable sur le portail. ${NOTE_PORTAIL}`,
    liens: [PORTAIL + "/carte-nationale-de-transport-demande/"],
  }),
  mk({
    id: "init5-ml-creer-association",
    titre: "Créer une association au Mali : déclaration et récépissé",
    categorie: CAT_ENT,
    lieu: "Mali",
    resume: "Les associations sont régies par la loi n° 04-038 du 5 août 2004. Pour avoir la reconnaissance officielle et la capacité juridique, les fondateurs font une déclaration après l’assemblée générale constitutive ; elle donne lieu à un récépissé. Gratuit.",
    etapes: [
      "Tenir l’assemblée générale constitutive, adopter les statuts et nommer les dirigeants (procès-verbal).",
      "Déposer la déclaration de création avec les pièces auprès de l’autorité administrative compétente.",
      "L’autorité délivre un récépissé daté et signé, au nom de l’association, qui liste les pièces jointes. Le délai dépend de la durée de l’enquête.",
    ],
    pieces: [
      "2 exemplaires de la déclaration de création, dont un timbré",
      "2 copies certifiées conformes du procès-verbal de l’assemblée constitutive",
      "2 copies certifiées conformes des statuts, dont une timbrée",
      "La déclaration indique le titre, l’objet, le siège et les autres locaux de l’association, ainsi que les noms, professions et adresses de ceux qui l’administrent ; elle est signée par trois dirigeants",
    ],
    cout: "Gratuit",
    delai: "Variable, selon la durée de l’enquête",
    adresse: "Autorité administrative compétente (non nommée sur la page, qui porte sur les clubs sportifs et associations sportives et culturelles : la même loi de 2004 s’applique aux associations en général, à confirmer au guichet). Pour la page RRTE d’une association, voir « Entraide & solidarité ». " + NOTE_PORTAIL,
    liens: [PORTAIL + "/comment-creer-un-club-sportif-ou-une-association-sportive-et-culturelle-asc/"],
  }),
  mk({
    id: "init5-ml-naissance-declaration-supletif",
    titre: "Déclarer une naissance au Mali, et jugement supplétif en cas de retard",
    categorie: CAT_ETAT,
    lieu: "Mali",
    resume: "Une naissance se déclare dans un délai de 30 jours ; la déclaration et l’acte sont gratuits. Passé ce délai, il faut un jugement supplétif du tribunal. Les parents retirent l’acte à la mairie dans les trois mois avec le carnet de naissance de la maternité.",
    etapes: [
      "Déclarer la naissance dans les 30 jours, à la mairie ou au centre d’état civil. En maternité ou centre de santé, la sage-femme ou la matrone peut déclarer ; les registres des maternités rurales passent par le CSCom le plus proche puis la mairie.",
      "Naissance hors d’une structure de santé : les parents, ou à défaut une personne présente à la naissance, déclarent l’enfant à la mairie ou au centre d’état civil le plus proche.",
      "Retirer l’acte de naissance à la mairie dans les trois mois, avec le carnet de naissance délivré par la maternité ou le centre de santé.",
      "Déclaration hors délai (jugement supplétif) : demande à la mairie ; la mairie l’étudie et la transmet au tribunal ; le tribunal convoque les parents avec l’enfant ; il rend le jugement supplétif et le renvoie à la mairie ; la mairie l’enregistre et remet le document attestant l’inscription.",
    ],
    pieces: [
      "Carnet de naissance de la maternité ou du centre de santé",
      "Jugement supplétif (si déclaration hors délai)",
      "Liste complète des pièces non précisée dans la source : se renseigner à la mairie",
    ],
    cout: "Déclaration et acte : gratuits. Jugement supplétif : selon un document de projet d’ONG, environ 1 500 FCFA à la mairie puis environ 2 200 FCFA au tribunal (environ 3 700 FCFA au total) ; ces chiffres ne sont pas un tarif officiel",
    delai: "Non précisé",
    adresse: "Mairie ou centre d’état civil ; tribunal pour le jugement supplétif.\nSource : document d’un projet ONG (« Un enfant par la main »), à confirmer à la mairie. Pour demander un extrait d’acte de naissance, voir la fiche du premier lot.",
    liens: ["https://www.unenfantparlamain.org/files/drupal/unenfantparlamain-etatcivil-mali.pdf"],
  }),
  mk({
    id: "init5-ml-mariage-mali-francais",
    titre: "Se marier au Mali quand l’un des époux est français (certificat de capacité à mariage)",
    categorie: CAT_MARIAGE,
    lieu: "Mali & France",
    resume: "Les autorités maliennes peuvent célébrer le mariage quelle que soit la nationalité des époux si l’un réside au Mali. Le conjoint français doit d’abord obtenir un certificat de capacité à mariage (CCAM) auprès du consulat de France, que les autorités maliennes exigent.",
    etapes: [
      "Constituer le dossier de CCAM avec le formulaire du consulat général de France à Bamako et les pièces justificatives. Déposer le dossier complet au moins 12 semaines avant la date prévue pour un mariage devant les autorités maliennes (3 mois pour un mariage au consulat).",
      "Audition possible des époux, ensemble ou séparément ; en cas de doute, le consulat peut saisir le procureur de la République de Nantes.",
      "Publication des bans au consulat (et à la mairie de domicile en France si l’un des époux y réside), pendant 10 jours.",
      "Après les 10 jours et la réception du certificat de non-opposition de la mairie française, le consulat délivre le CCAM.",
      "Célébration par les autorités maliennes, généralement la mairie du lieu de résidence : se renseigner directement auprès d’elle.",
      "Transcription du mariage sur les registres consulaires français, à la demande du conjoint français : formulaire, copie du contrat de mariage s’il existe, pièces complémentaires selon la situation ; plusieurs semaines.",
      "Contrat de mariage éventuel : à établir avant le mariage, devant un notaire français ou malien.",
    ],
    pieces: [
      "Conjoint français : fiche de renseignements, justificatif de nationalité française, pièce d’identité avec photo, justificatif de domicile ou de résidence, copie intégrale de l’acte de naissance de moins de 3 mois",
      "Liste exacte : formulaire spécifique au Mali du consulat général de France",
      "Livret de famille : pour y inscrire les enfants, fournir au consulat la copie de leur acte de naissance français",
    ],
    cout: "Non précisé sur la page consultée",
    delai: "Dossier à déposer 12 semaines avant la date du mariage ; bans 10 jours ; transcription de plusieurs semaines",
    adresse: "Consulat général de France, Square Patrice Lumumba, BP 17, Bamako. Depuis la France : Bamako Consulat, 13 rue Louveau, 92438 Châtillon cedex.\nPour deux époux français sans nationalité malienne, le consulat peut célébrer le mariage lui-même. Les conditions de fond du mariage au Mali relèvent du Code des personnes et de la famille. Source : ml.diplomatie.gouv.fr, à confirmer auprès du consulat.",
    liens: ["https://ml.diplomatie.gouv.fr/etat-civil/mariage"],
  }),
  mk({
    id: "init5-ml-securite-sociale",
    titre: "Sécurité sociale au Mali : INPS, AMO, RAMED et affiliation volontaire",
    categorie: CAT_IMPOTS,
    lieu: "Mali",
    resume: "L’INPS gère les accidents du travail, la vieillesse, l’invalidité, le décès et les prestations familiales du secteur privé. La CANAM gère l’assurance maladie obligatoire (AMO). Les travailleurs indépendants peuvent adhérer volontairement.",
    etapes: [
      "Salarié : l’employeur déclare chaque embauche à l’INPS dans les 8 jours ; le salarié obtient sa carte d’assuré social (voir la fiche INPS).",
      "Travailleur indépendant ou non-salarié : adhésion volontaire à l’INPS ; elle prend effet le premier jour du trimestre civil en cours à la réception de la demande.",
      "AMO : pour en bénéficier, l’assuré doit avoir cotisé au moins 6 mois consécutifs. La CANAM délègue la gestion à l’INPS (salariés et non-salariés du privé) et à la CMSS (fonctionnaires, militaires, parlementaires, pensionnés publics).",
      "RAMED : régime d’assistance médicale non contributif géré par l’ANAM, pour les personnes sans ressources.",
    ],
    pieces: ["Pièces d’immatriculation : voir la fiche « Carte d’assuré social INPS »", "Taux de cotisation : non repris ici (renvoi à la fiche de cotisations de l’INPS)"],
    cout: "Taux de cotisation non précisés dans la source. Prestations citées par le CLEISS : AMO 70 % à 80 % selon le poste (hospitalisation 80 %) ; allocations familiales 3 500 FCFA par enfant (4 000 FCFA pour un enfant handicapé) ; prime de premier établissement 13 650 FCFA ; allocations de maternité 16 380 FCFA au total",
    delai: "Adhésion volontaire : effective au 1er jour du trimestre civil en cours",
    adresse: "Centres INPS de la commune (exemple : Commune V, Quartier Mali, BP 59, tél. +223 20 21 25 54) ; CANAM ; CMSS ; ANAM.\nSource : CLEISS (page datée 2025, certains montants datent de 2016) : montants à confirmer à l’INPS.",
    liens: ["https://www.cleiss.fr/docs/regimes/regime_mali.html"],
  }),
  mk({
    id: "init5-ml-sejour-travail-etrangers",
    titre: "Étranger installé au Mali : carte de séjour et autorisation de travail (ce que l’on sait)",
    categorie: CAT_VISA,
    lieu: "Mali",
    resume: "Selon un guide d’édition février 2026 : le visa d’entrée est obligatoire pour les non-CEDEAO ; la carte de séjour est délivrée par la Direction nationale de la police ; l’autorisation de travail, délivrée par le Ministère de l’Emploi et de la Formation professionnelle, est demandée par l’employeur avant la signature du contrat. Aucune source officielle chiffrée n’a pu être consultée : à confirmer auprès des autorités.",
    etapes: [
      "Entrée : visa d’entrée obligatoire pour les ressortissants non-CEDEAO (voir la fiche « Visa pour entrer au Mali »). Les ressortissants CEDEAO sont dispensés de visa pour les séjours courts (90 jours sans visa selon le guide).",
      "Autorisation de travail (côté employeur), obligatoire avant la signature du contrat : demande motivée, profil de poste détaillé, preuve de recherche infructueuse d’un candidat national, statuts de l’entreprise, attestation fiscale et sociale.",
      "Instruction par une commission (Ministère de l’Emploi, ANPE, Inspection du travail) : 30 jours ouvrables selon le guide (à vérifier). Validité maximale de 2 ans, renouvelable : anticiper le renouvellement 3 mois avant l’expiration.",
      "Carte de séjour : délivrée par la Direction nationale de la police ; sa durée est en principe alignée sur celle du contrat de travail.",
      "Principes cités : préférence nationale (l’autorisation n’est accordée que si aucun travailleur malien qualifié n’est disponible et si l’employeur s’engage à former des nationaux) ; quota maximal d’étrangers dans le secteur privé (20 %, à vérifier) ; amendes en cas d’infraction (à vérifier).",
    ],
    pieces: [
      "Pièces à fournir par le travailleur étranger et pour la carte de séjour : non listées dans la source consultée",
      "Se renseigner à la Direction nationale de la police et au Ministère de l’Emploi",
    ],
    cout: "Non chiffré dans la source (« variable selon la catégorie d’emploi, à vérifier »). Des blogs d’immigration donnent des montants non sourcés : ils ne sont pas repris ici",
    delai: "Autorisation de travail : 30 jours ouvrables (à vérifier) ; carte de séjour : non précisé",
    adresse: "Direction nationale de la police (carte de séjour) ; Ministère de l’Emploi et de la Formation professionnelle, ANPE, Inspection du travail (autorisation de travail) ; INPS (affiliation de l’employeur).\nSource : guide AfriCarrieres, février 2026 (information générale non officielle). La plateforme officielle eRegulations Mali est annoncée pour les titres de séjour mais n’a pas pu être consultée : à vérifier.",
    liens: ["https://africarrieres.com/mali/en/guide/documents/71/download", "https://mali.eregulations.org/menu/56?l=fr"],
  }),
];
