"use client";

import AppShell from "@/components/AppShell";
import StructureForm from "@/components/StructureForm";

export default function Page() {
  return (
    <AppShell title="Créer ma page" subtitle="Elle sera publiée après validation par un administrateur">
      <StructureForm type="association" />
    </AppShell>
  );
}
