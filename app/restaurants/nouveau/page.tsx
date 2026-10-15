"use client";

import AppShell from "@/components/AppShell";
import RestoForm from "@/components/RestoForm";

export default function NouveauRestoPage() {
  return (
    <AppShell title="Ajouter mon restaurant" subtitle="Votre fiche sera publiée après validation par un administrateur">
      <RestoForm />
    </AppShell>
  );
}
