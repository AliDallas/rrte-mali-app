"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES_DEMANDE, CATEGORIE_EMPLOI, TypeDemande, estEmploi, libelleType } from "@/lib/demandes";
import Suggestions from "@/components/Suggestions";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function NouvelleDemandePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<TypeDemande>("cherche");
  const [titre, setTitre] = useState("");
  const [details, setDetails] = useState("");
  const [categorie, setCategorie] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !titre.trim()) return;
    setSaving(true);
    setMsg("");
    try {
      const ref = await addDoc(collection(db, "demandes"), {
        type,
        titre: titre.trim(),
        details: details.trim(),
        categorie,
        auteurUid: user.uid,
        auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
        auteurPhoto: profile.photo ?? "",
        statut: "ouverte",
        nbReponses: 0,
        createdAt: Date.now(),
      });
      router.push(`/demandes/${ref.id}`);
    } catch {
      setMsg("Impossible de publier pour le moment. Réessayez.");
      setSaving(false);
    }
  }

  const chip = (on: boolean) =>
    `flex-1 rounded-full border px-4 py-2.5 text-center text-sm ${on ? "border-gold-500 bg-gold-500 font-semibold text-ink" : "border-line bg-white text-muted"}`;

  return (
    <AppShell title="Nouvelle annonce" subtitle="Je cherche · Je propose">
      <Link href="/demandes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Demandes
      </Link>
      <div className="mb-4">
        {type === "cherche" && <Suggestions texte={titre} categorie={categorie} exclureUid={user?.uid} />}
      </div>
      <form onSubmit={envoyer} className="card space-y-4 p-5">
        <div className="flex gap-2">
          <button type="button" onClick={() => setType("cherche")} className={chip(type === "cherche")}>{libelleType("cherche", categorie).replace("Cherche", "Je cherche")}</button>
          <button type="button" onClick={() => setType("propose")} className={chip(type === "propose")}>{libelleType("propose", categorie)}</button>
        </div>
        <button
          type="button"
          onClick={() => setCategorie(estEmploi(categorie) ? "" : CATEGORIE_EMPLOI)}
          className={`w-full rounded-2xl border px-4 py-2.5 text-center text-sm ${estEmploi(categorie) ? "border-gold-500 bg-gold-500/15 font-semibold" : "border-line bg-white text-muted"}`}
        >
          {estEmploi(categorie) ? "Annonce d’emploi : touchez pour annuler" : "C’est une annonce d’emploi ? Touchez ici"}
        </button>
        <label className="block text-sm font-medium">
          {estEmploi(categorie) ? (type === "cherche" ? "Quel emploi cherchez-vous ?" : "Quel poste proposez-vous ?") : type === "cherche" ? "Que cherchez-vous ?" : "Que proposez-vous ?"}
          <input
            required
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder={
              estEmploi(categorie)
                ? type === "cherche"
                  ? "ex. Comptable, 5 ans d’expérience, disponible à Bamako"
                  : "ex. Chauffeur avec permis, ACI 2000, CDI"
                : type === "cherche"
                  ? "ex. Un plombier fiable à Hamdallaye"
                  : "ex. Livraison de repas, formation Excel"
            }
            className={input}
          />
        </label>
        <label className="block text-sm font-medium">
          Métier ou domaine
          <select value={categorie} onChange={(e) => setCategorie(e.target.value)} className={input}>
            <option value="">Choisir (facultatif)</option>
            {CATEGORIES_DEMANDE.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Détails
          <textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={estEmploi(categorie) ? "Expérience, contrat, salaire ou prétention, date de début, comment vous contacter…" : "Quartier, délai, budget…"} className={input} />
        </label>
        {msg && <p className="text-sm text-brand-red">{msg}</p>}
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? "Publication..." : (type === "cherche" ? "Publier quand même" : "Publier")}
        </button>
      </form>
    </AppShell>
  );
}
