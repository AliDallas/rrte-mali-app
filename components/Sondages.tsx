"use client";

import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { BarChart3, Plus, Trash2, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const input = "mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500";
const MODELE_PRESENCE = { question: "Serez-vous présent ?", options: ["Je serai présent", "Peut-être", "Absent"] };

interface Vote {
  uid: string;
  nom: string;
  choix: number[];
}
interface Sondage {
  id: string;
  question: string;
  options: string[];
  multiple: boolean;
  votes: Vote[];
}

/** Sondages d'un événement (présence, dates, options). Création par l'organisateur ou un administrateur, vote par tous les membres. */
export default function Sondages({ eventId, peutCreer }: { eventId: string; peutCreer: boolean }) {
  const { user, profile } = useAuth();
  const [sondages, setSondages] = useState<Sondage[] | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multiple, setMultiple] = useState(false);
  const [qui, setQui] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const r = await getDocs(collection(db, "events", eventId, "sondages"));
      const liste = await Promise.all(
        r.docs.map(async (d) => {
          const x = d.data();
          const v = await getDocs(collection(db, "events", eventId, "sondages", d.id, "votes")).catch(() => null);
          return {
            id: d.id,
            question: typeof x.question === "string" ? x.question : "",
            options: Array.isArray(x.options) ? (x.options as unknown[]).filter((o): o is string => typeof o === "string") : [],
            multiple: x.multiple === true,
            votes: v ? v.docs.map((e) => e.data() as Vote) : [],
            t: (x.creeLe as { seconds?: number } | undefined)?.seconds ?? 0,
          };
        })
      );
      liste.sort((a, b) => a.t - b.t);
      setSondages(liste);
    } catch {
      setSondages([]);
    }
  }, [eventId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setErreur("Écrivez la question.");
    if (opts.length < 2) return setErreur("Il faut au moins deux options.");
    setBusy(true);
    setErreur("");
    try {
      await addDoc(collection(db, "events", eventId, "sondages"), {
        question: question.trim(),
        options: opts,
        multiple,
        creeParUid: user?.uid ?? "",
        creeLe: serverTimestamp(),
      });
      setQuestion("");
      setOptions(["", ""]);
      setMultiple(false);
      setOuvert(false);
      await charger();
    } catch {
      setErreur("Impossible de créer le sondage.");
    }
    setBusy(false);
  }

  async function voter(s: Sondage, i: number) {
    if (!user || !profile) return;
    const mien = s.votes.find((v) => v.uid === user.uid);
    const ref = doc(db, "events", eventId, "sondages", s.id, "votes", user.uid);
    setBusy(true);
    try {
      let choix: number[];
      if (s.multiple) choix = mien?.choix.includes(i) ? mien.choix.filter((c) => c !== i) : [...(mien?.choix ?? []), i];
      else choix = mien?.choix.includes(i) ? [] : [i];
      if (choix.length === 0) await deleteDoc(ref);
      else await setDoc(ref, { uid: user.uid, nom: `${profile.prenom} ${profile.nom}`.trim(), choix, majLe: serverTimestamp() });
      await charger();
    } catch {
      setErreur("Impossible d’enregistrer votre réponse.");
    }
    setBusy(false);
  }

  async function supprimer(s: Sondage) {
    setBusy(true);
    try {
      const b = writeBatch(db);
      s.votes.forEach((v) => b.delete(doc(db, "events", eventId, "sondages", s.id, "votes", v.uid)));
      b.delete(doc(db, "events", eventId, "sondages", s.id));
      await b.commit();
      await charger();
    } catch {
      setErreur("Impossible de supprimer le sondage.");
    }
    setBusy(false);
  }

  if (sondages === null) return null;
  if (sondages.length === 0 && !peutCreer) return null;

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-gold-700" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-bold">Sondage</h2>
      </div>
      {erreur && <p className="text-sm text-brand-red">{erreur}</p>}

      {sondages.map((s) => {
        const mien = s.votes.find((v) => v.uid === user?.uid);
        const votants = s.votes.length;
        return (
          <div key={s.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <p className="flex-1 font-semibold">{s.question}</p>
              {peutCreer && (
                <button onClick={() => supprimer(s)} disabled={busy} aria-label="Supprimer le sondage" className="text-muted">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            {s.multiple && <p className="text-xs text-muted">Plusieurs réponses possibles.</p>}
            {s.options.map((o, i) => {
              const n = s.votes.filter((v) => v.choix.includes(i)).length;
              const choisi = !!mien?.choix.includes(i);
              return (
                <div key={i} className="space-y-1">
                  <button
                    onClick={() => voter(s, i)}
                    disabled={busy}
                    className={`relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm ${choisi ? "border-gold-500 font-semibold" : "border-line"}`}
                  >
                    <span className="absolute inset-y-0 left-0 bg-gold-500/20" style={{ width: `${votants ? Math.round((n / votants) * 100) : 0}%` }} />
                    <span className="relative flex items-center justify-between gap-2">
                      <span>{o}</span>
                      <span className="tabular-nums text-muted">{n}</span>
                    </span>
                  </button>
                  {peutCreer && qui === `${s.id}-${i}` && (
                    <p className="px-1 text-xs text-muted">{s.votes.filter((v) => v.choix.includes(i)).map((v) => v.nom).join(", ") || "Personne"}</p>
                  )}
                  {peutCreer && n > 0 && (
                    <button onClick={() => setQui(qui === `${s.id}-${i}` ? null : `${s.id}-${i}`)} className="px-1 text-[11px] text-gold-700 underline">
                      {qui === `${s.id}-${i}` ? "Masquer les noms" : "Voir les noms"}
                    </button>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-muted">{votants} réponse{votants > 1 ? "s" : ""}. Touchez à nouveau votre choix pour le retirer.</p>
          </div>
        );
      })}

      {peutCreer &&
        (ouvert ? (
          <form onSubmit={creer} className="space-y-2 rounded-2xl bg-gold-500/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Nouveau sondage</p>
              <button type="button" onClick={() => { setQuestion(MODELE_PRESENCE.question); setOptions(MODELE_PRESENCE.options); }} className="text-xs font-semibold text-gold-700 underline">
                Modèle « présence »
              </button>
            </div>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Votre question" className={input} />
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} className={input} />
                {options.length > 2 && (
                  <button type="button" aria-label="Retirer l’option" onClick={() => setOptions(options.filter((_, j) => j !== i))} className="px-1 text-muted">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 8 && (
              <button type="button" onClick={() => setOptions([...options, ""])} className="flex items-center gap-1 text-sm font-semibold text-gold-700">
                <Plus size={15} /> Ajouter une option
              </button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} /> Autoriser plusieurs réponses
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-gold flex-1">Publier le sondage</button>
              <button type="button" onClick={() => setOuvert(false)} className="btn-outline px-4">Annuler</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setOuvert(true)} className="btn-outline flex w-full items-center justify-center gap-2">
            <Plus size={16} /> Créer un sondage
          </button>
        ))}
    </section>
  );
}
