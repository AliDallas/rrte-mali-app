import Link from "next/link";
import { Briefcase, Utensils } from "lucide-react";
import Logo from "@/components/Logo";
import BrandStrip from "@/components/BrandStrip";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-7 py-10">
        <div className="mb-4 flex flex-col items-center gap-3 text-center">
          <Logo size={176} />
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-mute">
            Communauté de la diaspora, des expatriés et des Maliens de l’extérieur au Mali
          </p>
        </div>
        <Link href="/login" className="btn-gold">
          Connexion membre
        </Link>
        <Link href="/signup" className="btn-outline">
          Demander l’accès
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/entreprises"
            className="rounded-2xl border border-[#454A50] p-4 transition hover:bg-ink-2"
          >
            <Briefcase size={20} className="text-gold-500" strokeWidth={1.75} />
            <p className="mt-2 font-semibold">Entreprises</p>
            <p className="mt-0.5 text-xs text-ink-mute">Accès libre</p>
          </Link>
          <Link
            href="/restaurants"
            className="rounded-2xl border border-[#454A50] p-4 transition hover:bg-ink-2"
          >
            <Utensils size={20} className="text-gold-500" strokeWidth={1.75} />
            <p className="mt-2 font-semibold">Restaurants</p>
            <p className="mt-0.5 text-xs text-ink-mute">Accès libre</p>
          </Link>
        </div>
      </div>
      <BrandStrip />
    </main>
  );
}
