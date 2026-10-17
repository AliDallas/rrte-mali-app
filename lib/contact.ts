export const EMAIL_GROUPE = "rrtemaligroupe@gmail.com";
export const LIEN_CONTACT = `mailto:${EMAIL_GROUPE}?subject=${encodeURIComponent("Contact via l’application RRTE Mali")}`;

// Numéro WhatsApp de l'administrateur qui reçoit les demandes de départ, au format international sans « + » ni espaces
// (exemple : 22370000000). Tant qu'il est vide, WhatsApp s'ouvre et la personne choisit elle-même le contact.
export const WHATSAPP_ADMIN = "22369009690";
export const lienWhatsApp = (texte: string) => `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(texte)}`;
/** Lien WhatsApp vers un membre précis (message prérempli). Retourne null si le numéro est inutilisable. */
export function lienWhatsAppVers(telephone: string | undefined, texte: string): string | null {
  let n = (telephone ?? "").replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.length === 8) n = `223${n}`;
  if (n.length < 8) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(texte)}`;
}
export const lienMailDepart = (texte: string) =>
  `mailto:${EMAIL_GROUPE}?subject=${encodeURIComponent("Demande de départ RRTE")}&body=${encodeURIComponent(texte)}`;
