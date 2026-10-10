"use client";

import AppShell from "@/components/AppShell";

export default function Page() {
  return (
    <AppShell title="Entreprises" subtitle="Les activités de la communauté" requireAuth={false}>
      <p className="card p-8 text-center text-muted">
        La liste des entreprises et recommandations arrive bientôt. Accès libre, sans inscription.
      </p>
    </AppShell>
  );
}
