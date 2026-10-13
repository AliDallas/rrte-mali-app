"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Flag, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { MOTIFS_SIGNALEMENT } from "@/lib/signalements";

/** Bouton « Signaler » : envoie un signalement lisible uniquement par les administrateurs. */
export default function SignalerBouton({
  cibleType,
  cibleId,
  cibleNom,
  cibleUid = "",
  libelle = "Signaler",
  className = "",
}: {
  cibleType: "membre" | "reponse" | "annonce" | "fiche";
  cibleId: string;
  cibleNom: string;
  cibleUid?: string;
  libelle?: string;
  className?: string;
}) {
  const { user, profile } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [comm, setComm] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "fait" | "erreur">("saisie");

  if (!user || !profile || profile.statut !== "actif") return null;
  if (cibleUid && cibleUid === user.uid) return null;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !motif) return;
    setEtat("envoi");
    try {
      // un seul signalement par personne et par cible (l'identifiant le garantit)
      await setDoc(doc(db, "signalements", `${user.uid}_${cibleType}_${cibleId}`.slice(0, 200)), {
        auteurUid: user.uid,
        auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
        cibleType,
        cibleId,
        cibleNom,
        cibleUid,
        motif,
        commentaire: comm.trim(),
        chemin: typeof window !== "undefined" ? window.location.pathname : "",
        statut: "nouveau",
        createdAt: serverTimestamp(),
      });
      setEtat("fait");
    } catch {
      setEtat("erreur");
    }
  }

  return (
    <>
      <button onClick={() => { setOuvert(true); setEtat("saisie"); }} className={`inline-flex items-center gap-1.5 text-sm text-muted ${className}`}>
        <Flag size={14} /> {libelle}
      </button>
      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={() => setOuvert(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold">Signaler</p>
                <p className="text-sm text-muted">{cibleNom}</p>
              </div>
              <button onClick={() => setOuvert(false)} aria-label="Fermer" className="text-muted">
                <X size={20} />
              </button>
            </div>
            {etat === "fait" ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-[#E3F0DC] p-3 text-sm text-[#3C7026]">
                  Merci. Votre signalement a été transmis aux administrateurs, seuls à le lire. La personne n’en est pas informée.
                </p>
                <button onClick={() => setOuvert(false)} className="btn-gold">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={envoyer} className="space-y-3">
                <p className="text-sm text-muted">Pourquoi signalez-vous ? Les administrateurs étudient chaque signalement.</p>
                <div className="space-y-2">
                  {MOTIFS_SIGNALEMENT.map((m) => (
                    <label key={m} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${motif === m ? "border-gold-500 bg-gold-100/50" : "border-line"}`}>
                      <input type="radio" name="motif" checked={motif === m} onChange={() => setMotif(m)} className="mt-0.5" />
                      {m}
                    </label>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={comm}
                  onChange={(e) => setComm(e.target.value)}
                  placeholder="Précisions (facultatif)"
                  className="w-full rounded-2xl border border-line px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
                {etat === "erreur" && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Envoi impossible. Vous avez peut-être déjà signalé cet élément, ou la connexion a échoué.</p>
                )}
                <button type="submit" disabled={!motif || etat === "envoi"} className="btn-gold">
                  {etat === "envoi" ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
