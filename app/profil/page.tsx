"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ChevronRight, Mail } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilPage() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <AppShell title="Mon profil" subtitle="Votre fiche dans la communauté">
      <div className="card mb-4 flex items-center gap-4 p-4">
        <Avatar prenom={profile?.prenom} nom={profile?.nom} size={64} />
        <div className="min-w-0">
          <p className="font-display text-xl font-bold">
            {profile?.prenom} {profile?.nom}
          </p>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
            <Mail size={14} /> {profile?.email}
          </p>
          <span className="mt-1.5 inline-block rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-semibold text-gold-700">
            {profile?.role === "admin" ? "Administrateur" : "Membre RRTE"}
          </span>
        </div>
      </div>

      {profile?.role === "admin" && (
        <Link href="/admin" className="card mb-4 flex items-center gap-3 p-4">
          <ShieldCheck size={20} className="text-gold-700" strokeWidth={1.75} />
          <span className="flex-1 font-semibold">Administration</span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <button onClick={handleLogout} className="card flex w-full items-center gap-3 p-4 text-left">
        <LogOut size={20} className="text-muted" strokeWidth={1.75} />
        <span className="font-semibold">Se déconnecter</span>
      </button>
    </AppShell>
  );
}
