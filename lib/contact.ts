export const EMAIL_GROUPE = "rrtemaligroupe@gmail.com";
export const LIEN_CONTACT = `mailto:${EMAIL_GROUPE}?subject=${encodeURIComponent("Contact via l’application RRTE Mali")}`;

// Numéro WhatsApp de l'administrateur qui reçoit les demandes de départ, au format international sans « + » ni espaces
// (exemple : 22370000000). Tant qu'il est vide, WhatsApp s'ouvre et la personne choisit elle-même le contact.
export const WHATSAPP_ADMIN = "22369009690";
export const lienWhatsApp = (texte: string) => `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(texte)}`;
export const lienMailDepart = (texte: string) =>
  `mailto:${EMAIL_GROUPE}?subject=${encodeURIComponent("Demande de départ RRTE")}&body=${encodeURIComponent(texte)}`;
