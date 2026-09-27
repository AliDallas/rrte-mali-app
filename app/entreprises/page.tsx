import Link from "next/link";

export default function EntreprisesPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-gold-600 hover:underline">
          ← Accueil
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
          Entreprises du Groupe RRTE
        </h1>
        <p className="text-gray-500 mb-8">
          Accès public — consultez sans inscription.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          La liste des entreprises et recommandations arrive bientôt (Semaine 5).
        </div>
      </div>
    </main>
  );
}
