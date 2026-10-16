"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/AuthContext";
import { ResultatAttente, compterAttente } from "@/lib/enAttente";

export default function ATraiterPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin" && profile?.statut === "actif";
  const [details, setDetails] = useState<ResultatAttente[]>([]);
  const [total, setTotal] = useState(0);
  const [etat, setEtat] = useState<"charge" | "ok">("charge");

  function charger() {
    setEtat("charge");
    compterAttente()
      .then((r) => {
        setDetails(r.details);
        setTotal(r.total);
      })
      .finally(() => setEtat("ok"));
  }

  useEffect(() => {
    if (isAdmin) charger();
  }, [isAdmin]);

  const aTraiter = details.filter((d) => d.n > 0);

  return (
    <AppShell title="À traiter" subtitle="Ce qui attend un administrateur">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Administration
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : (
        <div className="space-y-3">
          <div className="card flex items-center gap-3 p-4">
            <BellRing className="text-gold-600" size={22} strokeWidth={1.75} />
            <div className="flex-1">
              <p className="font-semibold">{etat === "charge" ? "Vérification…" : total === 0 ? "Tout est traité" : `${total} élément${total > 1 ? "s" : ""} à traiter`}</p>
              <p className="text-xs text-muted">Mis à jour à chaque ouverture de l’application et toutes les minutes.</p>
            </div>
            <button onClick={charger} aria-label="Actualiser" className="rounded-full p-2 text-muted">
              <RefreshCw size={16} />
            </button>
          </div>

          {etat === "ok" && total === 0 && (
            <div className="card flex flex-col items-center gap-2 p-8 text-center">
              <CheckCircle2 className="text-emerald-600" size={28} />
              <p className="text-muted">Rien en attente pour le moment.</p>
            </div>
          )}

          {aTraiter.map((d) => (
            <Link key={d.cle} href={d.href} className="card flex items-center gap-3 border-l-4 border-brand-red p-4">
              <div className="flex-1">
                <p className="font-semibold">{d.libelle}</p>
                <p className="text-xs text-muted">Ouvrir la rubrique : les éléments en attente y sont signalés en rouge.</p>
              </div>
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-brand-red px-2 text-sm font-bold text-white">{d.n}</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
