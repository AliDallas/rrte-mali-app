import { BadgeCheck, ShieldCheck } from "lucide-react";

/** Badges du profil : « Membre RRTE » pour tous, « Administrateur » en plus pour les administrateurs. */
export default function Badges({ admin = false, compact = false }: { admin?: boolean; compact?: boolean }) {
  const t = compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full bg-gold-100 font-semibold text-gold-700 ${t}`}>
        <BadgeCheck size={compact ? 11 : 14} /> Membre RRTE
      </span>
      {admin && (
        <span className={`inline-flex items-center gap-1 rounded-full bg-ink font-semibold text-gold-500 ${t}`}>
          <ShieldCheck size={compact ? 11 : 14} /> Administrateur
        </span>
      )}
    </span>
  );
}
