// Première série de fiches « État civil » (Mali et France à l’étranger).
// Rédigées à partir de sources officielles consultées le 15/10/2026 (consulat de France à Bamako,
// France Diplomatie, wikiprocedure Mali, Pays-Bas/Suisse pour la légalisation).
// Importées en statut « en_attente » : un administrateur les relit puis les valide.

export interface DemarcheInitiale {
  id: string;
  titre: string;
  categorie: string;
  lieu: string;
  resume: string;
  etapes: string;
  pieces: string;
  cout: string;
  delai: string;
  adresse: string;
  liens: string[];
  verifieLe: string;
}

const VERIF = "2026-10-15";
const CONSULAT_BKO =
  "Consulat général de France à Bamako, Square Patrice Lumumba, BP 17, Bamako. Depuis la France : Bamako Consulat, 13 rue Louveau, 92438 Châtillon cedex.";
const SITE_CONSULAT = "https://ml.diplomatie.gouv.fr/etat-civil";

export const DEMARCHES_INITIALES: DemarcheInitiale[] = [
  {
    id: "init-fr-naissance-moins-30j",
    titre: "Déclarer la naissance d’un enfant né au Mali (moins de 30 jours) auprès du consulat de France",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali",
    resume:
      "Quand l’un des parents est français, la naissance d’un enfant né au Mali s’inscrit sur les registres français du consulat. Dans les 30 jours, c’est une déclaration faite par le parent français, avec l’enfant. Au-delà, voir la fiche « transcription après 30 jours ».",
    etapes: [
      "Faire d’abord établir l’acte de naissance malien (voir la fiche « Obtenir un acte de naissance malien »).",
      "Télécharger sur le site du consulat le formulaire de déclaration et la composition familiale courte et longue.",
      "Réunir les pièces ci-dessous (originaux demandés, pas d’extraits).",
      "Déposer le dossier : le consulat indique que les dossiers d’état civil se traitent désormais par courrier.",
      "Attendre la transcription (compter plusieurs semaines) puis demander les copies d’acte au Service central d’état civil de Nantes.",
      "Faire compléter le livret de famille en l’envoyant avec le dossier.",
    ].join("\n"),
    pieces: [
      "Formulaire de déclaration de naissance du consulat, signé par le parent français",
      "Composition familiale (courte et longue)",
      "Copie littérale originale de l’acte de naissance malien de l’enfant",
      "Volet n° 3 original de l’acte de naissance de l’enfant + photocopie",
      "Acte de mariage récent (original, copie intégrale), français ou malien",
      "Photocopie du certificat de nationalité française du parent français (sauf s’il est né en France d’un parent né en France)",
      "Photocopie de la carte d’identité française du parent français et de la pièce d’identité du parent étranger",
      "Certificat d’accouchement (original) et carnet de suivi de grossesse",
      "Si les parents ne sont pas mariés : acte de reconnaissance signé par le parent français en mairie, copie intégrale récente de son acte de naissance français, copie littérale de l’acte de naissance malien de l’autre parent (+ volet n° 3 s’il est né après 1987)",
      "Si l’acte du parent étranger vient d’un jugement supplétif : grosse du jugement + certificat de non-appel",
    ].join("\n"),
    cout: "Gratuit (transcription par courrier)",
    delai: "Plusieurs semaines après dépôt (non précisé officiellement)",
    adresse: CONSULAT_BKO,
    liens: [SITE_CONSULAT + "/naissance-0", "https://ml.diplomatie.gouv.fr/files/ml/files/liste-doc-naissance-mineur-30-jours.pdf"],
    verifieLe: VERIF,
  },
  {
    id: "init-fr-transcription-apres-30j",
    titre: "Faire transcrire un acte de naissance malien (après 30 jours, enfant ou adulte)",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali & France",
    resume:
      "La transcription recopie l’acte malien dans les registres consulaires français. Elle n’a pas de délai limite et n’est pas obligatoire, mais elle est vivement conseillée : elle donne un acte de naissance français et facilite passeport et carte d’identité.",
    etapes: [
      "Mineur : le parent français dépose la demande avec le formulaire de transcription pour mineur (au-delà de 30 jours) et sa liste de pièces.",
      "Majeur : la demande doit être faite par la personne elle-même, avec le formulaire pour majeur et la liste de pièces complémentaires.",
      "Joindre l’acte malien (avec traduction si nécessaire), la preuve de nationalité française d’au moins un parent et le livret de famille à mettre à jour.",
      "Envoyer le dossier au consulat (voir adresse). Un dossier incomplet est retourné.",
      "Une fois la transcription faite, demander les copies d’acte au Service central d’état civil (SCEC) de Nantes.",
      "Choix du nom : possible lors de la transcription, avant les 3 ans de l’enfant.",
    ].join("\n"),
    pieces: [
      "Formulaire de transcription (mineur ou majeur) du consulat de Bamako",
      "Acte de naissance malien (copie littérale originale + volet n° 3 si demandé)",
      "Preuve de la nationalité française d’au moins un parent (certificat de nationalité, acte de naissance français, etc.)",
      "Livret de famille des parents",
      "Pièces d’identité des parents / du demandeur",
      "Compositions familiales courte et longue",
      "Autres pièces possibles selon la situation (la liste exacte est dans le formulaire du consulat)",
    ].join("\n"),
    cout: "Gratuit (transcription par courrier)",
    delai: "Plusieurs semaines après dépôt",
    adresse: CONSULAT_BKO,
    liens: [SITE_CONSULAT + "/naissance-0", "https://www.diplomatie.gouv.fr/fr/services/faq/etat-civil"],
    verifieLe: VERIF,
  },
  {
    id: "init-fr-mariage-mali",
    titre: "Se marier au Mali quand on est français : certificat de capacité à mariage et transcription",
    categorie: "Mariage & divorce",
    lieu: "Mali & France",
    resume:
      "Le mariage peut avoir lieu au consulat (si les deux époux sont français et aucun malien) ou devant les autorités maliennes (mairie). Dans les deux cas, le dossier passe d’abord par le consulat pour obtenir le certificat de capacité à mariage (CCAM), puis le mariage malien est transcrit sur les registres français.",
    etapes: [
      "Constituer le dossier de demande de CCAM (formulaire et pièces sur le site du consulat).",
      "Le déposer assez tôt : au moins 3 mois avant la date pour un mariage au consulat, au moins 12 semaines avant pour un mariage devant les autorités maliennes.",
      "Le consulat peut convoquer les époux (ensemble ou séparément) pour une audition ; en cas de doute il saisit le procureur de la République de Nantes.",
      "Publication des bans : 10 jours au consulat (et à la mairie du domicile en France si l’un des époux y réside). Le mariage n’a lieu qu’après réception du certificat de non-opposition.",
      "Célébration : au consulat (dates limitées, nombre d’invités restreint, liste de témoins) ou à la mairie malienne.",
      "Si le mariage a eu lieu devant les autorités maliennes : le conjoint français demande la transcription (formulaire « mariage sans CCAM » + copie du contrat de mariage s’il y en a un).",
      "Faire compléter le livret de famille (l’envoyer avec le dossier).",
    ].join("\n"),
    pieces: [
      "Formulaire de demande de CCAM et pièces justificatives (liste sur le site du consulat)",
      "Pièces d’identité et actes de naissance récents des futurs époux",
      "Pour le consulat : liste des témoins (noms, prénoms, dates et lieux de naissance, professions, adresses)",
      "Contrat de mariage éventuel (notaire en France ou au Mali) à remettre avant la célébration, ou à la transcription si le mariage a eu lieu devant les autorités maliennes",
      "Livret de famille existant (pour le compléter) ; acte de naissance français des enfants à inscrire",
    ].join("\n"),
    cout: "Transcription gratuite par courrier ; frais éventuels de la mairie malienne et du notaire non précisés",
    delai: "Dossier complet 3 mois avant (consulat) ou 12 semaines avant (mairie malienne) ; transcription : plusieurs semaines",
    adresse: CONSULAT_BKO,
    liens: [SITE_CONSULAT + "/mariage"],
    verifieLe: VERIF,
  },
  {
    id: "init-fr-copie-acte-nantes",
    titre: "Demander une copie ou un extrait d’acte d’état civil français né à l’étranger (SCEC Nantes)",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "France",
    resume:
      "Pour un acte transcrit par un consulat (naissance, mariage, décès à l’étranger), les copies et extraits sont délivrés gratuitement par le Service central d’état civil (SCEC) du ministère des Affaires étrangères, à Nantes. La voie en ligne est la plus rapide.",
    etapes: [
      "Se rendre sur le formulaire officiel de demande de copie ou d’extrait d’acte (lien ci-dessous ou via service-public.fr).",
      "Indiquer l’état civil de la personne concernée, le lieu et la date de l’événement, et votre adresse postale personnelle (jamais celle du consulat : les copies seraient détruites).",
      "Valider la demande en ligne ; si le formulaire ne fonctionne pas, désactiver les bloqueurs de fenêtres ou envoyer la demande par courrier au SCEC de Nantes.",
      "Attendre l’envoi par courrier.",
    ].join("\n"),
    pieces: [
      "Nom, prénoms, date et lieu de l’événement, filiation de la personne concernée",
      "Numéro d’acte si vous l’avez",
      "Adresse postale personnelle pour la réponse",
    ].join("\n"),
    cout: "Gratuit",
    delai: "En général environ 1 semaine en ligne, plus le délai postal (plus long et variable depuis l’étranger)",
    adresse: "Service central d’état civil (SCEC), ministère de l’Europe et des Affaires étrangères, Nantes. Pour un acte français né en France : la mairie du lieu de naissance.",
    liens: [
      "https://www.diplomatie.gouv.fr/fr/services-aux-francais/etat-civil-et-nationalite-francaise/etat-civil/article/demander-la-copie-d-un-acte-d-etat-civil",
      "https://www.diplomatie.gouv.fr/fr/services/faq/etat-civil",
    ],
    verifieLe: VERIF,
  },
  {
    id: "init-fr-livret-famille",
    titre: "Livret de famille : duplicata et mise à jour quand on vit à l’étranger",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali & France",
    resume:
      "Le livret de famille est remis aux titulaires (parents). Pour le compléter (naissance, mariage) ou en obtenir un duplicata, on s’adresse à la mairie de résidence, ou au consulat si l’on vit à l’étranger.",
    etapes: [
      "Mise à jour : envoyer le livret avec le dossier de transcription (naissance, mariage) ; le consulat le complète.",
      "Duplicata (perte, vol, divorce) : demande motivée au consulat de Bamako si vous résidez au Mali.",
      "Un livret n’est délivré qu’à ses titulaires : vous ne pouvez pas demander celui de vos parents.",
    ].join("\n"),
    pieces: [
      "Livret existant à mettre à jour",
      "Pour un duplicata : justificatif du motif (déclaration de perte ou de vol certifiée par la police, jugement de divorce…)",
      "Pièce d’identité",
    ].join("\n"),
    cout: "Non précisé sur les pages consultées (à vérifier auprès du consulat)",
    delai: "Plusieurs semaines",
    adresse: CONSULAT_BKO,
    liens: [SITE_CONSULAT, "https://www.diplomatie.gouv.fr/fr/services/faq/etat-civil"],
    verifieLe: VERIF,
  },
  {
    id: "init-fr-deces-etranger",
    titre: "Décès au Mali d’un Français : déclaration auprès du consulat",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali & France",
    resume:
      "Un décès survenu au Mali peut être déclaré aux services consulaires de la circonscription où il a eu lieu. Il n’y a pas de délai pour faire établir l’acte de décès. Le décès doit d’abord être déclaré aux autorités maliennes.",
    etapes: [
      "Faire constater le décès et déclarer le décès à la mairie / centre d’état civil malien pour obtenir l’acte de décès malien.",
      "Contacter le consulat de France à Bamako pour la déclaration ou la transcription de l’acte de décès sur les registres français.",
      "Demander ensuite les copies d’acte au SCEC de Nantes (gratuit).",
    ].join("\n"),
    pieces: [
      "Acte de décès malien (original) et traduction si nécessaire",
      "Pièces d’identité du défunt et du déclarant, livret de famille",
      "Liste exacte des pièces : à demander au service d’état civil du consulat",
    ].join("\n"),
    cout: "Gratuit pour la transcription ; frais locaux non précisés",
    delai: "Non précisé",
    adresse: CONSULAT_BKO,
    liens: [SITE_CONSULAT],
    verifieLe: VERIF,
  },
  {
    id: "init-ml-acte-naissance",
    titre: "Obtenir un acte de naissance malien (déclaration dans les 30 jours)",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali",
    resume:
      "La naissance doit être déclarée dans les 30 jours. Si l’enfant naît dans une maternité ou un centre de santé, la structure transmet la déclaration à la mairie ou au centre d’état civil. Les parents retirent ensuite l’acte. Au-delà de 30 jours, il faut un jugement supplétif.",
    etapes: [
      "À la maternité / au centre de santé : la naissance est enregistrée et la déclaration (volet II) est envoyée au centre d’état civil de rattachement. Un numéro de déclaration ou un carnet de naissance est remis.",
      "Hors structure de santé : les parents ou une personne présente à l’accouchement se rendent eux-mêmes à la mairie ou au centre d’état civil le plus proche.",
      "Se présenter au centre d’état civil avec le numéro ou le carnet de naissance (dans les 3 mois selon une source associative).",
      "Vérifier l’exactitude des informations (noms, dates) avant la signature du maire.",
      "Retirer l’extrait (volet III) et demander des copies : elles sont disponibles dans n’importe quel centre d’état civil du pays.",
    ].join("\n"),
    pieces: [
      "Déclaration de naissance de la maternité ou du centre de santé (ou carnet de naissance)",
      "Pièces d’identité des parents",
      "Pour des copies : l’extrait d’acte (volet III)",
    ].join("\n"),
    cout: "Déclaration et extrait gratuits ; copie de l’extrait : environ 100 FCFA",
    delai: "En général sous 24 heures après réception de la demande au centre d’état civil",
    adresse: "Mairie ou centre d’état civil du lieu de naissance (ou de rattachement de la maternité). Contact indiqué : 20 29 94.",
    liens: ["https://wikiprocedure.com/index.php/Mali_-_Obtain_Birth_Certificate"],
    verifieLe: VERIF,
  },
  {
    id: "init-ml-jugement-supletif",
    titre: "Jugement supplétif d’acte de naissance au Mali (déclaration tardive)",
    categorie: "État civil (naissance, actes, livret)",
    lieu: "Mali",
    resume:
      "Quand la naissance n’a pas été déclarée dans le délai (30 jours), c’est le tribunal qui rend un jugement supplétif, sur la base duquel la mairie établit l’acte. Les consulats demandent la grosse du jugement et un certificat de non-appel pour ces actes.",
    etapes: [
      "Les parents (ou l’intéressé) déposent une demande à la mairie / centre d’état civil.",
      "La mairie transmet le dossier au tribunal, qui convoque les parents avec l’enfant.",
      "Paiement des frais de procédure.",
      "Le tribunal rend le jugement supplétif et le renvoie à la mairie.",
      "La mairie enregistre et remet l’acte à la famille.",
      "Pour un usage en France : demander au tribunal la grosse du jugement et le certificat de non-appel.",
    ].join("\n"),
    pieces: [
      "Demande à la mairie / centre d’état civil",
      "Pièces d’identité des parents ; pour l’intéressé, toute pièce prouvant sa naissance (carnet, témoins…) : liste à confirmer auprès de la mairie ou du tribunal",
    ].join("\n"),
    cout: "Environ 3 700 FCFA au total selon une source associative (1 500 FCFA mairie + 2 200 FCFA tribunal) : à vérifier, les montants peuvent avoir changé",
    delai: "Non précisé par les sources consultées",
    adresse: "Mairie du lieu de naissance, puis tribunal compétent (tribunal de la commune du lieu de naissance).",
    liens: ["https://www.unenfantparlamain.org/files/drupal/unenfantparlamain-etatcivil-mali.pdf"],
    verifieLe: VERIF,
  },
  {
    id: "init-ml-acte-mariage",
    titre: "Obtenir un acte de mariage malien ou une copie",
    categorie: "Mariage & divorce",
    lieu: "Mali",
    resume:
      "L’acte de mariage civil est établi par l’officier d’état civil de la commune où le mariage a été célébré. Pour une copie, on s’adresse à cette même commune. Les mariages d’avant 1962 enregistrés par jugement se demandent au tribunal.",
    etapes: [
      "Le mariage civil est célébré à la mairie par l’officier d’état civil (renseignez-vous à la mairie sur les pièces demandées aux époux).",
      "Pour obtenir une copie : demander à la commune où le mariage a été célébré.",
      "Pour un mariage d’avant 1962 constaté par jugement : demander une copie au tribunal.",
      "Un certificat de célibat se demande à l’état civil local.",
      "Pour un usage en France : faire légaliser l’acte (voir fiche « Légaliser un acte malien ») et, si besoin, le faire transcrire par le consulat.",
    ].join("\n"),
    pieces: [
      "Pièces d’identité des époux (liste exacte à confirmer auprès de la mairie)",
      "Pour une copie : indications sur le mariage (noms, date, commune)",
    ].join("\n"),
    cout: "Non précisé (à vérifier auprès de la mairie)",
    delai: "Non précisé",
    adresse: "Mairie / centre d’état civil de la commune du mariage.",
    liens: ["https://www.netherlandsworldwide.nl/legalisation/foreign-documents/mali.fr"],
    verifieLe: VERIF,
  },
  {
    id: "init-ml-legalisation",
    titre: "Légaliser un acte d’état civil malien pour l’utiliser à l’étranger",
    categorie: "Légalisation, traduction & apostille",
    lieu: "Mali",
    resume:
      "Pour qu’un acte malien soit accepté à l’étranger, il est en général légalisé : d’abord par le tribunal, puis par le ministère malien des Affaires étrangères. Seuls les originaux sont acceptés.",
    etapes: [
      "Se procurer l’acte original (copie littérale) auprès de la mairie ou du tribunal.",
      "Faire légaliser l’acte par le Tribunal (indiqué : TGI de la Commune III du District de Bamako).",
      "Faire ensuite légaliser par le ministère des Affaires étrangères du Mali.",
      "Un proche peut faire la démarche avec une procuration.",
      "Vérifier auprès de l’administration de destination si elle demande aussi une traduction ou des documents récents (ex. moins de 3 mois pour le consulat de France).",
    ].join("\n"),
    pieces: [
      "Acte original (les photocopies ne sont pas acceptées ; les originaux remis ne sont pas toujours restitués)",
      "Procuration si un tiers fait la démarche",
    ].join("\n"),
    cout: "Non précisé par les sources consultées",
    delai: "Non précisé",
    adresse: "Tribunal compétent à Bamako, puis ministère des Affaires étrangères du Mali.",
    liens: ["https://www.netherlandsworldwide.nl/legalisation/foreign-documents/mali.fr"],
    verifieLe: VERIF,
  },
];
