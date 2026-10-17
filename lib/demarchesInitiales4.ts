// Quatrième lot de fiches : carte d’identité biométrique (CNIBS), NINA, visa du Mali, naissance d’un enfant à l’étranger,
// autorisation de sortie d’un mineur. Sources consultées le 17/10/2026 : maliweb.net / L’Essor, amap.ml, bamada.net, gnawo.com,
// diplomatie.gouv.fr, ml.diplomatie.gouv.fr, douane.gouv.fr, consulat du Mali à Paris, ambassades du Mali (Allemagne, ONU, Sénégal).
// Importées « en attente » pour relecture. Plusieurs sources sont des articles de presse : à confirmer auprès du guichet.

import type { DemarcheInitiale } from "./demarchesInitiales";

const V = "2026-10-17";
const CAT_ID = "Passeport & carte d’identité";
const CAT_VISA = "Visas & titres de séjour";
const CAT_ETAT = "État civil (naissance, actes, livret)";
const CAT_FAM = "Famille & enfants";
const NOTE_PRESSE = "Source : articles de presse, à confirmer auprès du commissariat ou de la mairie avant de vous déplacer.";

function mk(d: Omit<DemarcheInitiale, "etapes" | "pieces" | "verifieLe"> & { etapes: string[]; pieces: string[]; verifieLe?: string }): DemarcheInitiale {
  return { ...d, etapes: d.etapes.join("\n"), pieces: d.pieces.join("\n"), verifieLe: d.verifieLe ?? V };
}

export const DEMARCHES_INITIALES_4: DemarcheInitiale[] = [
  mk({
    id: "init4-ml-cnibs",
    titre: "Carte nationale d’identité biométrique sécurisée (CNIBS) : la nouvelle carte d’identité malienne",
    categorie: CAT_ID,
    lieu: "Mali",
    resume: "Depuis 2023, la CNIBS remplace de plein droit la carte NINA, la carte d’identité nationale, la carte consulaire et la carte d’électeur. Valable 5 ans, demandée à partir de 5 ans et exigible à partir de 15 ans. L’ancienne carte d’identité reste valable au plus un an après les premières délivrances (délai prorogeable par arrêté).",
    etapes: [
      "Vérifier où et quand retirer sa carte : site jevalidemonnina.ml, numéros verts 80 00 80 80 et 80 00 82 82, ou SMS au 36223.",
      "Se présenter au lieu indiqué : commissariats de police et brigades de gendarmerie de Bamako (stations d’enrôlement installées par le concessionnaire SBA), ou mairie / commissariat désigné ; dans les consulats et ambassades du Mali à l’étranger.",
      "La carte est produite à partir de la base RAVEC, qui contient le numéro NINA ; un défaut de mise à jour dans la base n’empêche pas de l’obtenir.",
      "Retrait individuel, par reconnaissance faciale ou empreinte digitale.",
      "Remettre aux autorités les anciennes cartes (carte NINA, carte d’identité, carte consulaire) au moment de la délivrance.",
    ],
    pieces: [
      "Liste officielle des pièces non précisée dans les sources consultées : se renseigner au commissariat ou à la brigade",
      "Anciennes cartes à rendre : carte d’identité nationale, carte consulaire, carte NINA",
    ],
    cout: "Première délivrance gratuite (première phase, majeurs). Selon l’arrêté n° 2024-1922/MSPC-SG du 25/06/2024 cité par la presse : 5 000 FCFA au Mali, 8 000 FCFA dans les consulats, 11 000 FCFA pour le service premium livré en 48 h ; renouvellement payant (virement, carte bancaire ou mobile money)",
    delai: "Non précisé ; service premium en 48 h (11 000 FCFA)",
    adresse: "Commissariats et brigades de gendarmerie (Bamako d’abord), représentations diplomatiques et consulaires du Mali.\nRéférences : décret n° 2022-0639/PT-RM du 3 novembre 2022 ; arrêté n° 2024-1922/MSPC-SG du 25 juin 2024. Une carte d’identité biométrique « AES » est aussi annoncée : suivre les annonces officielles. " + NOTE_PRESSE + " La fiche « Carte nationale d’identité malienne : demande » décrit l’ancienne procédure.",
    liens: [
      "https://www.maliweb.net/societe/carte-nationale-didentite-biometrique-securisee-desormais-disponible-3018667.html",
      "https://www.maliweb.net/societe/carte-nationale-didentite-biometrique-securisee-obligatoire-a-partir-de-15-ans-avec-une-duree-de-validite-de-5-ans-2-3002655.html",
      "https://www.maliweb.net/police/carte-nationale-didentite-biometrique-securisee-les-commissariats-et-brigades-territoriales-charges-de-lenrolement-et-de-la-delivrance-3087852.html",
    ],
  }),
  mk({
    id: "init4-ml-nina-fiche",
    titre: "NINA : numéro d’identification, carte NINA et fiche descriptive individuelle",
    categorie: CAT_ID,
    lieu: "Mali",
    resume: "Le NINA est le numéro d’identification nationale lié à l’enrôlement RAVEC. La carte NINA est désormais remplacée par la CNIBS ; en attendant, la fiche descriptive individuelle NINA, gratuite, sert de preuve du numéro (elle a longtemps permis de demander un passeport).",
    etapes: [
      "Enrôlement au RAVEC (recensement administratif à vocation d’état civil), gratuit : collecte de l’identité, des empreintes et de la photo.",
      "La fiche descriptive individuelle contient le NINA ; elle est gratuite, sans signature ni cachet. Elle se retire auprès du Centre de traitement des données de l’état civil (CTDEC, Korofina) ou de la mairie où l’on s’est enrôlé.",
      "Vérifier son enrôlement et son lieu de retrait : jevalidemonnina.ml, numéros verts 80 00 80 80 et 80 00 82 82, ou SMS au 36223.",
      "Attention : plusieurs articles de presse (2021 et plus récents) signalent des intermédiaires qui demandent de l’argent (par exemple 20 000 FCFA) pour accélérer l’obtention de la fiche. La fiche est gratuite : n’accepter aucune demande de paiement non officielle.",
      "Aujourd’hui, la CNIBS remplace la carte NINA et la carte d’électeur : voir la fiche dédiée.",
    ],
    pieces: [
      "Pièces non listées dans les sources consultées : se renseigner à la mairie ou au CTDEC",
      "NINA temporaire (octobre 2023, pour les candidats au recrutement dans l’armée) : copie de l’extrait de naissance, copie de la carte d’identité biométrique ou de la carte NINA des parents, copie des diplômes antérieurs à 2009",
    ],
    cout: "Enrôlement RAVEC et fiche descriptive : gratuits selon la presse",
    delai: "Variable : de longs délais entre l’enrôlement et la carte ont été signalés",
    adresse: "CTDEC (Direction nationale de l’état civil), Korofina, Bamako ; mairies ; centres d’enrôlement ; plateforme jevalidemonnina.ml (l’ancien site ctdec.ml ne fonctionnait plus fin 2021).\nMaliens de l’étranger : l’enrôlement passe par les consulats (voir la fiche sur l’enrôlement des enfants nés en France). " + NOTE_PRESSE,
    liens: ["https://bamada.net/ouestmonetat-la-difficile-quete-de-la-fiche-descriptive-individuelle-nina", "https://amap.ml/la-remise-de-la-carte-nationale-didentite-biometrique-a-commence-mardi/"],
  }),
  mk({
    id: "init4-ml-nina-enfants-france",
    titre: "Enrôlement NINA d’un enfant malien né en France (consulat du Mali à Paris)",
    categorie: CAT_ID,
    lieu: "Mali & France",
    resume: "Pour les enfants nés en France ou au Portugal : formulaire en ligne sur le site du consulat du Mali à Paris, puis, selon l’âge, démarche entièrement en ligne (moins de 14 ans) ou rendez-vous au consulat (14 ans et plus).",
    etapes: [
      "Remplir le formulaire en ligne en respectant strictement l’acte de naissance ; un code de validation est envoyé par courriel.",
      "Moins de 14 ans : la procédure se fait entièrement en ligne, avec téléchargement de l’acte de naissance malien et de la preuve de nationalité.",
      "14 ans et plus : prise de rendez-vous au consulat avec les actes de naissance maliens et la preuve de nationalité.",
    ],
    pieces: [
      "Acte de naissance malien : seuls sont acceptés ceux délivrés par les consulats généraux du Mali à Paris et à Lyon, ou le volet 3 de l’acte transcrit au Centre spécial de l’état civil au Mali",
      "Preuve de nationalité malienne : certificat de nationalité, ou pièce d’identité malienne du père ou de la mère (pour un parent décédé : pièce d’identité malienne et acte de décès)",
    ],
    cout: "Non précisé sur la page : demander au consulat",
    delai: "Non précisé sur la page",
    adresse: "Consulat général du Mali à Paris (page NINA enrôlement). Pour un enfant né au Mali, voir plutôt la CNIBS et l’enrôlement RAVEC au Mali.",
    liens: ["https://consulatdumalienfrance.fr/nina-enrolement/"],
  }),
  mk({
    id: "init4-ml-visa-mali",
    titre: "Visa pour entrer au Mali (conjoint étranger, famille, visiteurs)",
    categorie: CAT_VISA,
    lieu: "Mali",
    resume: "Les ressortissants français doivent avoir un visa pour entrer au Mali : pas de visa à l’arrivée à l’aéroport de Bamako (refus d’embarquement ou d’entrée). Les Franco-Maliens doivent voyager avec leur passeport malien en cours de validité, sauf visa apposé sur le passeport français.",
    etapes: [
      "Demander le visa auprès d’un consulat ou d’une ambassade du Mali. Pour les Français : consulats généraux du Mali à Paris ou à Lyon, uniquement sur rendez-vous ; visa de 30 jours, renouvelable sur place (source : France Diplomatie, mise à jour du 15/09/2026).",
      "Préparer le dossier de base (exemple de l’ambassade du Mali en Allemagne) : 2 photos d’identité récentes, passeport valable au moins 6 mois après l’entrée, copie des deux premières pages, réservation aller-retour, copie de l’identité de la personne qui invite, justificatif du motif, preuve de vaccination contre la fièvre jaune, preuve de paiement.",
      "Selon le motif : tourisme (attestation d’accueil, lettre d’invitation légalisée, assurance), affaires (lettre d’invitation légalisée, attestation de société), mission (lettre de mission).",
      "Binationaux franco-maliens : depuis le 14 janvier 2024, seul le passeport malien en cours de validité est accepté, sauf visa sur le passeport français ; carte d’identité, NINA, acte de naissance, sauf-conduit et laissez-passer ne sont pas recevables (source : France Diplomatie).",
    ],
    pieces: [
      "Passeport en cours de validité, vaccination fièvre jaune obligatoire",
      "Les listes et frais exacts varient selon l’ambassade ou le consulat : consulter le site de la mission compétente",
    ],
    cout: "Varie selon la mission. Exemples : ambassade du Mali en Allemagne, entrées multiples : 70 € (3 mois), 90 € (6 mois) ; Mission du Mali auprès de l’ONU : 80 $ (3 mois, entrée unique), 110 $ (3 mois, entrées multiples), 200 $ (6 mois), 370 $ (1 an) ; frais non remboursables si le visa n’est pas délivré",
    delai: "Non précisé dans les sources ; traitement en 1 jour possible avec supplément dans certaines missions (50 $ à l’ONU)",
    adresse: "Consulats généraux du Mali à Paris et à Lyon (Français) ; ambassade du Mali du pays de résidence.\nLe ministère français des Affaires étrangères indique que, dans le contexte régional actuel, tout déplacement au Mali est formellement déconseillé : consulter ses conseils aux voyageurs avant de partir. Un séjour long d’un étranger au Mali relève d’autres formalités (titre de séjour) non couvertes ici.",
    liens: ["https://www.diplomatie.gouv.fr/fr/information-par-pays/mali/conseils-aux-voyageurs-entree-sejour", "https://ambassademali.de/fr/visa/", "https://www.un.int/mali/mali/visa-dentr%C3%A9e-au-mali"],
  }),
  mk({
    id: "init4-ml-naissance-enfant-etranger-malien",
    titre: "Enfant né à l’étranger de parent malien : transcription de l’acte de naissance",
    categorie: CAT_ETAT,
    lieu: "Mali & France",
    resume: "L’acte de naissance étranger se transcrit auprès du consulat ou de l’ambassade du Mali compétent pour obtenir un acte malien. Pièces et frais varient selon la mission : voici les exemples publiés par le consulat du Mali à Paris et l’ambassade du Mali au Sénégal.",
    etapes: [
      "Consulat du Mali à Paris (enfants nés en France, au Portugal ou en Guyane française) : remplir le formulaire en ligne, le valider, l’imprimer et le signer.",
      "Envoyer le formulaire signé, les pièces et le paiement sous pli fermé à l’adresse du consulat (53 rue Hoche, 93170 Bagnolet) ; l’adresse de retour doit être en France.",
      "Ambassade du Mali au Sénégal : réunir les pièces ci-dessous ; coût et délai non précisés sur sa page, qui indique le (+223) 20 23 82 73 et info@ambassenmali.org pour les obtenir.",
      "Une fois l’acte malien obtenu, il peut servir pour l’enrôlement NINA/CNIBS de l’enfant (voir les fiches dédiées).",
    ],
    pieces: [
      "Consulat de Paris : copie intégrale originale de l’acte de naissance de moins de 3 mois ; copie du passeport biométrique malien ou du NINA du père ou de la mère ; justificatif de domicile (quittance de loyer, facture d’électricité ou d’eau)",
      "Ambassade du Mali au Sénégal : photocopie de la carte consulaire ; photocopie de la carte d’identité ou du passeport du père et de la mère ; deux extraits de naissance délivrés par la mairie du lieu de naissance de l’enfant (au Mali), dont le « volet 3 »",
      "Mission du Mali auprès de l’ONU (extrait pour un enfant né aux États-Unis) : copie de l’extrait américain, copie de la pièce d’identité malienne du parent, 2 photos de l’enfant",
    ],
    cout: "Consulat du Mali à Paris : 5 € par acte à transcrire ; Mission du Mali à l’ONU : 10 $ ; autres missions : à demander",
    delai: "Non précisé à Paris ; 30 jours ouvrables à la Mission du Mali auprès de l’ONU",
    adresse: "Consulat général du Mali à Paris (Bagnolet) ou ambassade / consulat du Mali du pays de naissance de l’enfant.\nProcédure à confirmer auprès de la mission compétente avant d’envoyer vos originaux.",
    liens: ["https://consulatdumalienfrance.fr/declaration-naissance/", "https://www.ambasenmali.org/transcription-de-naissance-pieces-a-fournir/", "https://www.un.int/mali/mali/acte-de-naissance-1"],
  }),
  mk({
    id: "init4-fr-naissance-enfant-bamako",
    titre: "Enfant né au Mali d’un parent français : déclaration ou transcription au consulat de France",
    categorie: CAT_ETAT,
    lieu: "Mali & France",
    resume: "Un parent français peut faire déclarer ou transcrire la naissance de son enfant au consulat général de France à Bamako. Le délai pour une déclaration est de 30 jours après la naissance ; au-delà, seule la transcription est possible. Les dossiers d’état civil se traitent par courrier.",
    etapes: [
      "Moins de 30 jours : le parent français déclare la naissance (père, mère ou les deux) ou demande la transcription de l’acte malien, avec la demande signée, la liste des pièces et les formulaires de composition familiale (courte et longue).",
      "Plus de 30 jours, enfant mineur : mêmes formalités, avec la demande de transcription signée par le parent français.",
      "Plus de 30 jours, enfant majeur : la demande est faite par l’intéressé lui-même, avec le formulaire dédié et les pièces complémentaires ; délai de traitement de plusieurs semaines.",
      "Dossiers traités par courrier. Copies d’actes : naissance au Mali = Service central d’état civil, 11 rue de la Maison Blanche, 44941 Nantes Cedex 09 (en ligne ou par courrier). Indiquer son adresse personnelle, pas celle du consulat, sinon les copies sont détruites.",
    ],
    pieces: [
      "Enfant né dans le mariage : copie littérale originale de l’acte malien et volet n° 3, acte de mariage français de moins de 3 mois, livret de famille français, pièces d’identité, certificat d’accouchement, compositions familiales courte et longue",
      "Enfant né hors mariage : acte de naissance intégral du parent français, acte littéral du parent étranger (moins de 3 mois, avec volet n° 3 si né après 1987), certificat de nationalité française, pièces d’identité, certificat d’accouchement, compositions familiales ; acte de reconnaissance établi en mairie française si la première demande a été faite en France",
      "Pièces supplémentaires possibles selon les cas : liste complète sur ml.diplomatie.gouv.fr",
    ],
    cout: "Non précisé sur la page consultée",
    delai: "Plusieurs semaines après le dépôt (enfant majeur) ; non précisé pour les autres cas",
    adresse: "Consulat général de France à Bamako, service de l’état civil : etat-civil.bamako-fslt@diplomatie.gouv.fr (coordonnées à confirmer sur ml.diplomatie.gouv.fr).",
    liens: ["https://ml.diplomatie.gouv.fr/etat-civil/naissance-0"],
  }),
  mk({
    id: "init4-fr-autorisation-sortie-mineur",
    titre: "Autorisation de sortie du territoire (AST) d’un mineur résidant en France",
    categorie: CAT_FAM,
    lieu: "France",
    resume: "Depuis le 15 janvier 2017, un mineur qui habite en France et quitte le territoire sans parent (ni autre titulaire de l’autorité parentale) doit avoir une AST. Elle concerne les mineurs français et étrangers résidant en France. Pour un enfant qui voyage depuis le Mali, voir plutôt le titre de voyage CEDEAO.",
    etapes: [
      "Remplir le formulaire Cerfa n° 15646*01 (en ligne sur service-public.fr ou à télécharger), l’imprimer et le signer par un titulaire de l’autorité parentale.",
      "Aucune démarche en mairie ni en préfecture : l’enfant ou l’adulte accompagnant porte le formulaire avec la copie de la pièce d’identité du parent signataire.",
      "Vérifier les conditions d’entrée du pays de destination : certains pays peuvent demander une preuve que l’autre parent autorise le voyage.",
    ],
    pieces: [
      "Mineur français : carte d’identité ou passeport ; AST signée ; photocopie de la pièce d’identité du parent signataire",
      "Mineur étranger : passeport seul ; titre d’identité républicain (TIR) ou document de circulation pour étranger mineur (DCEM) ; AST signée ; photocopie du passeport et du titre de séjour du parent signataire",
    ],
    cout: "Gratuit",
    delai: "Immédiat (formulaire à remplir soi-même) ; durée de validité non précisée sur la page consultée : service-public.fr ou Infos Douane Service 0 800 94 40 40 (depuis la France)",
    adresse: "Pas de guichet : formulaire à remplir soi-même. Au Mali : voir la fiche « Titre de voyage CEDEAO pour les moins de 18 ans », qui tient lieu d’autorisation de sortie.",
    liens: ["https://www.douane.gouv.fr/fiche/autorisation-de-sortie-du-territoire-ast-pour-les-mineurs"],
  }),
];
