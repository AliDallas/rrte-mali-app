"use client";

import AppShell from "@/components/AppShell";
import EntrepriseEditeur from "@/components/EntrepriseEditeur";
import { useAuth } from "@/lib/AuthContext";
import { saisieVide } from "@/lib/entreprises";

export default function NouvelleEntreprisePage() {
  const { profile } = useAuth();
  if (!profile) return <AppShell title="Ajouter une entreprise">{null}</AppShell>;
  return (
    <AppShell title="Ajouter une entreprise" subtitle="Votre activité, reliée à votre contact">
      <EntrepriseEditeur initial={{ ...saisieVide(), tel: profile.telephone ?? "" }} />
    </AppShell>
  );
}
