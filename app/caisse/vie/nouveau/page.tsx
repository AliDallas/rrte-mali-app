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
import { TYPES_VIE } from "@/lib/caisse";

const input = "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

function Contenu() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState("");
  const [moi, setMoi] = useState(false);
  const [personne, setPersonne] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const nomSignalant = `${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim();

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!type) return setErreur("Choisissez le type d’événement.");
    setEnvoi(true);
    setErreur("");
    try {
      await addDoc(collection(db, "vie_evenements"), {
        uid: user.uid,
        nomSignalant,
        type,
        personne: moi ? nomSignalant : personne.trim(),
        date,
        message: message.trim(),
        statut: "en_attente",
        creeLe: serverTimestamp(),
      });
      router.push("/caisse/vie");
    } catch {
      setErreur("L’envoi a échoué. Réessayez.");
      setEnvoi(false);
    }
  }

  return (
    <AppShell title="Signaler un événement" subtitle="Vie du groupe">
      <Link href="/caisse/vie" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Vie du groupe
      </Link>
      <form onSubmit={envoyer} className="space-y-4">
        <section className="card space-y-3 p-5">
          <p className="text-sm font-semibold">Type d’événement</p>
          <div className="flex flex-wrap gap-2">
            {TYPES_VIE.map((t) => (
              <button
                type="button"
                key={t.cle}
                onClick={() => setType(t.cle)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${type === t.cle ? "bg-ink text-ink-fg" : "border border-line"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" checked={moi} onChange={(e) => setMoi(e.target.checked)} className="h-4 w-4 accent-[#B8860B]" />
            Cela me concerne personnellement
          </label>
          {!moi && (
            <label className="block text-sm font-semibold">
              Personne concernée (nom, et lien avec un membre si besoin)
              <input required value={personne} onChange={(e) => setPersonne(e.target.value)} maxLength={120} placeholder="Ex. : le père de Mamadou Diallo" className={input} />
            </label>
          )}
          <label className="block text-sm font-semibold">
            Date
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Message (facultatif)
            <textarea rows={4} maxLength={600} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Informations utiles que la famille accepte de partager : lieu, horaire, contact…" className={input} />
          </label>
        </section>
        {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
        <button disabled={envoi} className="btn-gold w-full">{envoi ? "Envoi…" : "Envoyer pour validation"}</button>
        <p className="text-xs text-muted">Un administrateur vérifie avant la publication dans le groupe.</p>
      </form>
    </AppShell>
  );
}

export default function NouveauVieePage() {
  return (
    <CaisseAcces>
      <Contenu />
    </CaisseAcces>
  );
}
