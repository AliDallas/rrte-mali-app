"use client";

import { useState } from "react";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { Check, Search, UserCog } from "lucide-react";
import { db } from "@/lib/firebase";
import { viderCache } from "@/lib/cache";

interface Membre {
  uid: string;
  nom: string;
  email: string;
}

/** Réservé aux administrateurs RRTE : confier la page d'une association ou d'un collectif à un autre membre actif. */
export default function ChangerAdministrateur({
  structureId,
  adminActuel,
  onDone,
}: {
  structureId: string;
  adminActuel: string;
  onDone: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [q, setQ] = useState("");
  const [choix, setChoix] = useState<Membre | null>(null);
  const [etat, setEtat] = useState<"saisie" | "charge" | "envoi" | "erreur">("saisie");

  async function ouvrir() {
    setOuvert(true);
    if (membres.length) return;
    setEtat("charge");
    try {
      const r = await getDocs(query(collection(db, "users"), where("statut", "==", "actif")));
      setMembres(
        r.docs
          .map((d) => {
            const x = d.data() as Record<string, unknown>;
            return { uid: d.id, nom: `${typeof x.prenom === "string" ? x.prenom : ""} ${typeof x.nom === "string" ? x.nom : ""}`.trim(), email: typeof x.email === "string" ? x.email : "" };
          })
          .filter((m) => m.nom)
          .sort((a, b) => a.nom.localeCompare(b.nom))
      );
      setEtat("saisie");
    } catch {
      setEtat("erreur");
    }
  }

  async function confirmer() {
    if (!choix) return;
    setEtat("envoi");
    try {
      await updateDoc(doc(db, "structures", structureId), { ownerUid: choix.uid, ownerNom: choix.nom });
      viderCache("structures");
      setOuvert(false);
      setChoix(null);
      setEtat("saisie");
      onDone();
    } catch {
      setEtat("erreur");
    }
  }

  if (!ouvert) {
    return (
      <button onClick={ouvrir} className="btn-outline flex w-full items-center justify-center gap-2">
        <UserCog size={16} /> Changer l’administrateur de la page
      </button>
    );
  }

  const n = q.trim().toLowerCase();
  const trouves = membres.filter((m) => !n || `${m.nom} ${m.email}`.toLowerCase().includes(n)).slice(0, 8);

  return (
    <div className="card space-y-3 p-4 text-sm">
      <p className="font-semibold">Nouvel administrateur de la page</p>
      <p className="text-xs text-muted">Actuellement : {adminActuel}. Le nouvel administrateur doit être un membre actif et aura seul le droit de publier et modifier cette page.</p>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-3.5 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un membre…"
          className="w-full rounded-full border border-line bg-white py-3 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>
      {etat === "charge" && <p className="text-muted">Chargement des membres…</p>}
      {etat === "erreur" && <p className="text-brand-red">Impossible de continuer. Réessayez.</p>}
      <div className="space-y-1">
        {trouves.map((m) => (
          <button
            key={m.uid}
            type="button"
            onClick={() => setChoix(m)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${choix?.uid === m.uid ? "border-gold-500 bg-gold-100" : "border-line"}`}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{m.nom}</span>
              <span className="block truncate text-xs text-muted">{m.email}</span>
            </span>
            {choix?.uid === m.uid && <Check size={16} className="text-gold-700" />}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={confirmer} disabled={!choix || etat === "envoi"} className="btn-gold flex-1">
          {etat === "envoi" ? "Transfert…" : choix ? `Confier à ${choix.nom}` : "Choisir un membre"}
        </button>
        <button
          onClick={() => {
            setOuvert(false);
            setChoix(null);
          }}
          className="btn-outline flex-1"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
