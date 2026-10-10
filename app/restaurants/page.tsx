"use client";

import AppShell from "@/components/AppShell";

export default function Page() {
  return (
    <AppShell title="Restaurants" subtitle="Menus, avis et réservations" requireAuth={false}>
      <p className="card p-8 text-center text-muted">
        La liste des restaurants et menus arrive bientôt. Accès libre, sans inscription.
      </p>
    </AppShell>
  );
}
