"use client";

import { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { CAISSE_VISIBLE_MEMBRES } from "@/lib/caisse";

/** Tant que la caisse n'est pas annoncée, seuls les administrateurs y accèdent. */
export default function CaisseAcces({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return <>{children}</>;
  if (profile.role === "admin" || CAISSE_VISIBLE_MEMBRES) return <>{children}</>;
  return (
    <AppShell title="Caisse solidaire">
      <p className="card p-6 text-center text-muted">La caisse solidaire n’est pas encore ouverte. Elle sera annoncée prochainement.</p>
    </AppShell>
  );
}
