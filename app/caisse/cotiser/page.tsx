"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, ImagePlus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import CaisseAcces from "@/components/CaisseAcces";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { reduireImage } from "@/lib/image";
import {
  Cotisant, MONTANT_MENSUEL, NUMERO_CAISSE, RYTHMES, TITULAIRE_CAISSE, anneeCaisse, caisseOuverte, empreinte, fcfa, statutCotisation,
} from "@/lib/caisse";

const input = "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

function CotiserContenu() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const annee = anneeCaisse();
  const admin = profile?.role === "admin";
  const [couverts, setCouverts] = useState(0);
  const [nbMois, setNbMois] = useState(3);
  const [reference, setReference] = useState("");
  const [capture, setCapture] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "cotisants", `${user.uid}_${annee}`))
      .then((s) => setCouverts(s.exists() ? (s.data() as Cotisant).moisCouverts : 0))
      .catch(() => undefined);
  }, [user, annee]);

  const restant = 12 - couverts;
  const options = RYTHMES.filter((r) => r.mois <= restant);
  const mois = Math.min(nbMois, Math.max(restant, 1));
  const montant = MONTANT_MENSUEL * mois;
  const rythme = RYTHMES.find((r) => r.mois === mois)?.label ?? `${mois} mois`;
  const ouvert = caisseOuverte() || admin;

  async function choisirImage(f: File | undefined) {
    if (!f) return;
    setErreur("");
    try {
      setCapture(await reduireImage(f, 1100, 0.7));
    } catch {
      setErreur("Cette image n’a pas pu être lue. Essayez une autre capture d’écran.");
    }
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    if (!capture) {
      setErreur("Ajoutez la capture d’écran de votre paiement.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    try {
      await addDoc(collection(db, "cotisations"), {
        uid: user.uid,
        nom: `${profile.prenom} ${profile.nom}`.trim(),
        annee,
        nbMois: mois,
        montant,
        rythme,
        reference: reference.trim(),
        capture,
        empreinte: empreinte(capture),
        statut: "en_attente",
        creeLe: serverTimestamp(),
      });
      router.push("/caisse");
    } catch {
      setErreur("L’envoi a échoué. Vérifiez votre connexion et réessayez (la capture est peut-être trop lourde).");
      setEnvoi(false);
    }
  }

  return (
    <AppShell title="Cotiser" subtitle={`Caisse solidaire ${annee}`}>
      <Link href="/caisse" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Caisse solidaire
      </Link>
      {!ouvert ? (
        <p className="card p-6 text-center text-muted">Les paiements ouvrent le 1er janvier 2027.</p>
      ) : restant <= 0 ? (
        <p className="card p-6 text-center text-muted">Votre cotisation {annee} est déjà complète. Merci !</p>
      ) : (
        <form onSubmit={envoyer} className="space-y-4">
          {!caisseOuverte() && <div className="rounded-xl bg-gold-500/10 p-3 text-sm">Mode test (administrateur) : la caisse n’a pas encore ouvert pour les membres.</div>}
          {couverts > 0 && (
            <div className="rounded-xl bg-gold-500/10 p-3 text-sm">{statutCotisation(couverts, annee).texte}. Il reste {restant} mois à régler pour {annee}.</div>
          )}

          <section className="card space-y-3 p-5">
            <h2 className="font-display text-lg font-bold">1. Choisissez votre rythme</h2>
            <div className="space-y-2">
              {options.map((r) => (
                <label key={r.mois} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${mois === r.mois ? "border-gold-500 bg-gold-500/10" : "border-line"}`}>
                  <input type="radio" name="rythme" checked={mois === r.mois} onChange={() => setNbMois(r.mois)} className="h-4 w-4 accent-[#B8860B]" />
                  <span className="flex-1 text-[15px] font-semibold">{r.label}</span>
                  <span className="text-sm tabular-nums">{fcfa(MONTANT_MENSUEL * r.mois)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="card space-y-2 p-5">
            <h2 className="font-display text-lg font-bold">2. Payez {fcfa(montant)}</h2>
            {NUMERO_CAISSE ? (
              <p className="text-[15px]">
                Envoyez par Orange Money au <b className="select-all">{NUMERO_CAISSE}</b>
                {TITULAIRE_CAISSE && <> (au nom de {TITULAIRE_CAISSE})</>}.
              </p>
            ) : (
              <p className="text-[15px]">Le numéro de la caisse sera communiqué par les administrateurs avant l’ouverture.</p>
            )}
            <p className="text-sm text-muted">Gardez la capture d’écran de la confirmation de paiement.</p>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-display text-lg font-bold">3. Envoyez la capture d’écran</h2>
            {capture ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capture} alt="Capture de paiement" className="max-h-80 w-full rounded-xl border border-line object-contain" />
                <button type="button" onClick={() => setCapture("")} aria-label="Retirer la capture" className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-muted">
                <ImagePlus size={26} />
                <span className="text-sm font-semibold">Choisir la capture d’écran</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => choisirImage(e.target.files?.[0])} />
              </label>
            )}
            <label className="block text-sm font-semibold">
              Numéro de transaction (facultatif)
              <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} className={input} />
            </label>
          </section>

          {erreur && <div className="rounded-xl bg-brand-red/15 p-3 text-sm text-brand-red">{erreur}</div>}
          <button disabled={envoi} className="btn-gold w-full">{envoi ? "Envoi…" : `Envoyer mon paiement de ${fcfa(montant)}`}</button>
          <p className="text-xs text-muted">Le trésorier vérifie votre capture puis valide : votre statut se met à jour dans l’application.</p>
        </form>
      )}
    </AppShell>
  );
}

export default function CotiserPage() {
  return (
    <CaisseAcces>
      <CotiserContenu />
    </CaisseAcces>
  );
}
