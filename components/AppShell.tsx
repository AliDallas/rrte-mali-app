"use client";

import { ReactNode, useEffect, useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  HandHelping,
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
  { href: "/demandes", label: "Demandes", Icon: HandHelping },
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

  const [enAttente, setEnAttente] = useState(0);
  const [reglementOk, setReglementOk] = useState(false);
  const [accepteOk, setAccepteOk] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  // le règlement a été mis à jour : les membres qui l'ont accepté avant cette date doivent le ré-accepter
  const REGLEMENT_VERSION = Date.UTC(2026, 9, 12);
  const doitAccepter =
    !!user && profile?.statut === "actif" && requireAuth && !reglementOk && (profile.reglementAccepteLe ?? 0) < REGLEMENT_VERSION;

  async function accepterReglement() {
    if (!user) return;
    setEnvoi(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { reglementAccepteLe: Date.now() });
      setReglementOk(true);
    } catch {
      /* réessayer */
    } finally {
      setEnvoi(false);
    }
  }
  const estAdmin = profile?.role === "admin" && profile?.statut === "actif";

  useEffect(() => {
    if (!estAdmin) return;
    let stop = false;
    const charger = () =>
      Promise.all([
        getDocs(query(collection(db, "users"), where("statut", "==", "en_attente"))),
        getDocs(query(collection(db, "prestataires"), where("statut", "==", "en_attente"))),
      ])
        .then(([a, b]) => !stop && setEnAttente(a.size + b.size))
        .catch(() => undefined);
    charger();
    const t = setInterval(charger, 60000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [estAdmin]);

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

  if (user && (profile?.statut === "en_attente" || profile?.statut === "refuse" || profile?.statut === "radie")) {
    const refuse = profile?.statut === "refuse" || profile?.statut === "radie";
    const radie = profile?.statut === "radie";
    return (
      <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <Logo size={96} />
          <h1 className="font-display text-2xl font-bold">
            {radie ? "Accès retiré" : refuse ? "Inscription non retenue" : "Inscription en cours d’examen"}
          </h1>
          <p className="max-w-sm text-ink-mute">
            {radie
              ? "Votre accès à l’application RRTE a été retiré. Contactez un administrateur RRTE pour en savoir plus."
              : refuse
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

  if (doitAccepter) {
    return (
      <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-7 py-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo size={96} />
            <h1 className="font-display text-2xl font-bold">Règlement mis à jour</h1>
            <p className="text-sm text-ink-mute">
              Le règlement de RRTE a évolué pour l’application. Merci de le lire et de l’accepter pour continuer.
            </p>
          </div>
          <a href="/reglement" target="_blank" rel="noopener noreferrer" className="btn-outline block text-center">
            Lire le règlement
          </a>
          <label className="flex items-start gap-2 text-sm text-ink-mute">
            <input type="checkbox" checked={accepteOk} onChange={(e) => setAccepteOk(e.target.checked)} className="mt-1" />
            <span>J’ai lu et j’accepte le règlement du groupe.</span>
          </label>
          <button className="btn-gold" disabled={!accepteOk || envoi} onClick={accepterReglement}>
            {envoi ? "Enregistrement..." : "Continuer"}
          </button>
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
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] ${
                  on ? "text-gold-500" : "text-ink-mute"
                }`}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={1.75} />
                  {href === "/profil" && estAdmin && enAttente > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                      {enAttente}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
