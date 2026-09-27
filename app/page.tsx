import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gold-50 to-white px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          RRTE MALI APP
        </h1>
        <p className="text-lg text-gray-600 mb-2 italic">
          Réunir, Rester, Travailler Ensemble
        </p>
        <p className="text-gray-500 mb-10">
          La plateforme communautaire des Franco-Maliens installés ou actifs au Mali.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-gold-500 text-white rounded-lg font-semibold hover:bg-gold-600 transition"
          >
            Connexion Membre
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 border-2 border-gold-500 text-gold-600 rounded-lg font-semibold hover:bg-gold-50 transition"
          >
            Devenir Membre
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Link
            href="/entreprises"
            className="p-5 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-900">🏢 Entreprises</h3>
            <p className="text-sm text-gray-500 mt-1">
              Découvrez les entreprises du groupe RRTE — accès libre
            </p>
          </Link>
          <Link
            href="/restaurants"
            className="p-5 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <h3 className="font-semibold text-gray-900">🍽️ Restaurants</h3>
            <p className="text-sm text-gray-500 mt-1">
              Les restaurants du groupe et leurs menus — accès libre
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
