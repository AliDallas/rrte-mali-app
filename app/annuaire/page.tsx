"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function AnnuairePage() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </main>
    );
  }

  if (!user) return null;

  if (profile?.statut === "en_attente") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gold-50 px-6">
        <div className="max-w-md bg-white p-8 rounded-xl shadow-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            Compte en attente d&apos;approbation ⏳
          </h1>
          <p className="text-gray-600 mb-6">
            Un administrateur doit valider votre inscription avant que vous
            puissiez accéder à l&apos;annuaire complet.
          </p>
          <button
            onClick={logout}
            className="text-gold-600 font-semibold hover:underline"
          >
            Se déconnecter
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Annuaire des Membres RRTE
          </h1>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Déconnexion
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          Bienvenue {profile?.prenom} 👋 <br />
          La liste des 224 membres arrive ici dès l&apos;import des données
          (Semaine 2).
        </div>
      </div>
    </main>
  );
}
