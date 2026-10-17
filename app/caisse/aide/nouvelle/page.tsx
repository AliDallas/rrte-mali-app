"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { TYPES_AIDE } from "@/lib/caisse";

const input = "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

function Contenu() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState(TYPES_AIDE[0]);
  const [urgence, setUrgence] = useState<"urgent" | "normal">("normal");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [telephone, setTelephone] = useState(profile?.telephone ?? "");
  const [accord, setAccord] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    if (!accord) return setErreur("Cochez la case pour confirmer que le comité peut lire votre demande.");
    setEnvoi(true);
    setErreur("");
    try {
      const m = Math.round(Number(montant));
      await addDoc(collection(db, "aides"), {
        uid: user.uid,
        nom: `${profile.prenom} ${profile.nom}`.trim(),
        telephone: telephone.trim(),
        type,
        urgence,
        description: description.trim(),
        ...(m > 0 ? { montantDemande: m } : {}),
        statut: "nouvelle",
        creeLe: serverTimestamp(),
      });
      router.push("/caisse/aide");
    } catch {
      setErreur("L’envoi a échoué. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <AppShell title="Demander une aide" subtitle="Caisse solidaire">
      <Link href="/caisse/aide" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Mes demandes
      </Link>
      <form onSubmit={envoyer} className="space-y-4">
        <div className="rounded-xl bg-gold-500/10 p-3 text-sm">
          Votre demande est confidentielle : seuls le comité d’aide et les administrateurs la lisent. Le comité décide de l’aide et de son montant, dans la limite des moyens de la caisse. Une aide n’est pas garantie.
        </div>
        <section className="card space-y-3 p-5">
          <label className="block text-sm font-semibold">
            Nature de la demande
            <select value={type} onChange={(e) => setType(e.target.value)} className={input}>
              {TYPES_AIDE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <div>
            <p className="text-sm font-semibold">Degré d’urgence</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setUrgence("normal")} className={`rounded-xl px-3 py-3 text-sm font-semibold ${urgence === "normal" ? "bg-ink text-ink-fg" : "border border-line"}`}>Demande</button>
              <button type="button" onClick={() => setUrgence("urgent")} className={`rounded-xl px-3 py-3 text-sm font-semibold ${urgence === "urgent" ? "bg-brand-red text-white" : "border border-line"}`}>Urgence</button>
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Expliquez votre situation
            <textarea required rows={6} maxLength={1500} value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Montant souhaité en FCFA (facultatif)
            <input type="number" inputMode="numeric" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Téléphone pour vous joindre
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className={input} />
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[15px]">
            <input type="checkbox" checked={accord} onChange={(e) => setAccord(e.target.checked)} className="mt-1 h-4 w-4 accent-[#B8860B]" />
            J’accepte que le comité d’aide et les administrateurs lisent ma demande.
          </label>
        </section>
        {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
        <button disabled={envoi} className="btn-gold w-full">{envoi ? "Envoi…" : urgence === "urgent" ? "Envoyer ma demande d’urgence" : "Envoyer ma demande"}</button>
      </form>
    </AppShell>
  );
}

export default function NouvelleAidePage() {
  return (
    <CaisseAcces>
      <Contenu />
    </CaisseAcces>
  );
}
