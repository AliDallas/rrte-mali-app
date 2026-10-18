import { BadgeCheck, ClipboardCheck, ShieldCheck, Sparkles } from "lucide-react";

/** Badges du profil : « Membre RRTE » pour tous ; « Nouveau membre » (moins de 30 jours), « Fiche complète » et « Administrateur » selon le cas. */
export default function Badges({ admin = false, compact = false, complete = false, nouveau = false }: { admin?: boolean; compact?: boolean; complete?: boolean; nouveau?: boolean }) {
  const t = compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full bg-gold-100 font-semibold text-gold-700 ${t}`}>
        <BadgeCheck size={compact ? 11 : 14} /> Membre RRTE
      </span>
      {nouveau && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-brand-blue/15 font-semibold text-brand-blue ${t}`}>
          <Sparkles size={compact ? 11 : 14} /> Nouveau membre
        </span>
      )}
      {complete && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 font-semibold text-emerald-700 ${t}`}>
          <ClipboardCheck size={compact ? 11 : 14} /> Fiche complète
        </span>
      )}
      {admin && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-ink font-semibold text-gold-500 ${t}`}>
          <ShieldCheck size={compact ? 11 : 14} /> Administrateur
        </span>
      )}
    </span>
  );
}
