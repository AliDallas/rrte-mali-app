"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  CalendarDays,
  User,
  Utensils,
  ThumbsUp,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Logo from "./Logo";
import BrandStrip from "./BrandStrip";

const MEMBER_NAV = [
  { href: "/accueil", label: "Accueil", Icon: Home },
  { href: "/annuaire", label: "Membres", Icon: Users },
  { href: "/entreprises", label: "Entreprises", Icon: Briefcase },
  { href: "/prestataires", label: "Recommandés", Icon: ThumbsUp },
  { href: "/evenements", label: "Événements", Icon: CalendarDays },
  { href: "/profil", label: "Profil", Icon: User },
];

const GUEST_NAV = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/entreprises", label: "Entreprises", Icon: Briefcase },
  { href: "/restaurants", label: "Restaurants", Icon: Utensils },
  { href: "/login", label: "Connexion", Icon: LogIn },
];

export default function AppShell({
  title,
  subtitle,
  children,
  requireAuth = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (requireAuth && !loading && !user) router.push("/login");
  }, [requireAuth, loading, user, router]);

  if (loading || (requireAuth && !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink">
        <Logo size={72} />
      </main>
    );
  }

  if (user && (profile?.statut === "en_attente" || profile?.statut === "refuse")) {
    const refuse = profile?.statut === "refuse";
    return (
      <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <Logo size={96} />
          <h1 className="font-display text-2xl font-bold">
            {refuse ? "Inscription non retenue" : "Inscription en cours d’examen"}
          </h1>
          <p className="max-w-sm text-ink-mute">
            {refuse
              ? "Votre demande n’a pas été validée. Contactez un administrateur RRTE pour en savoir plus."
              : "Un administrateur doit valider votre inscription avant l’accès à l’annuaire. Vous pourrez ensuite vous reconnecter."}
          </p>
          <div className="w-full max-w-xs space-y-3">
            {!refuse && (
              <button className="btn-gold" onClick={() => window.location.reload()}>
                Vérifier à nouveau
              </button>
            )}
            <button className="btn-outline" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </div>
        <BrandStrip />
      </main>
    );
  }

  const nav = user ? MEMBER_NAV : GUEST_NAV;

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-ink text-ink-fg">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-4 px-5 pb-5 pt-6">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink-mute">{subtitle}</p>}
          </div>
          <Logo size={40} />
        </div>
        <BrandStrip />
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-28 pt-5">{children}</div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 bg-ink"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex max-w-3xl">
          {nav.map(({ href, label, Icon }) => {
            const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
                  on ? "text-gold-500" : "text-ink-mute"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
