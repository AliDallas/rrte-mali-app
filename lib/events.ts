import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export interface EventItem {
  id: string;
  titre: string;
  description: string;
  date: string; // AAAA-MM-JJ
  heure: string; // HH:mm
  lieu: string;
  attendees: string[];
  created_by: string;
}

export function dayParts(date: string): { jour: string; mois: string } {
  const d = parseISO(date);
  if (!isValid(d)) return { jour: "--", mois: "" };
  return {
    jour: format(d, "d", { locale: fr }),
    mois: format(d, "MMM", { locale: fr }).replace(".", "").toUpperCase(),
  };
}

export function longDate(date: string): string {
  const d = parseISO(date);
  if (!isValid(d)) return date;
  return format(d, "EEEE d MMMM yyyy", { locale: fr });
}

export function isUpcoming(date: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return date >= today;
}
