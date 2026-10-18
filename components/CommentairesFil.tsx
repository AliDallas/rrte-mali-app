"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { Send, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import SignalerBouton from "@/components/SignalerBouton";
import { Commentaire, MAX_COMMENTAIRE, commentaireDepuisDoc, depuis } from "@/lib/fil";

/** Commentaires sous une publication du fil. Chargés à l'ouverture, pour ne pas lire tous les commentaires du fil d'un coup. */
export default function CommentairesFil({ postId, ownerUid, onCount }: { postId: string; ownerUid: string; onCount: (n: number) => void }) {
  const { user, profile } = useAuth();
  const admin = profile?.role === "admin";
  const [liste, setListe] = useState<Commentaire[] | null>(null);
  const [texte, setTexte] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const compte = useRef(onCount);
  compte.current = onCount;

  const charger = useCallback(async () => {
    try {
      const r = await getDocs(query(collection(db, "fil", postId, "commentaires"), orderBy("creeLe", "asc")));
      const l = r.docs.map((d) => commentaireDepuisDoc(d.id, d.data()));
      setListe(l);
      compte.current(l.length);
    } catch {
      setListe([]);
      setErreur("Impossible de charger les commentaires.");
    }
  }, [postId]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !texte.trim()) return;
    setBusy(true);
    setErreur("");
    try {
      await addDoc(collection(db, "fil", postId, "commentaires"), {
        texte: texte.trim().slice(0, MAX_COMMENTAIRE),
        auteurUid: user.uid,
        auteurNom: `${profile.prenom} ${profile.nom}`.trim(),
        creeLe: serverTimestamp(),
      });
      setTexte("");
      await charger();
    } catch {
      setErreur("Impossible d’envoyer votre commentaire. Réessayez.");
    }
    setBusy(false);
  }

  async function supprimer(c: Commentaire) {
    try {
      await deleteDoc(doc(db, "fil", postId, "commentaires", c.id));
      await charger();
    } catch {
      setErreur("Impossible de supprimer ce commentaire.");
    }
  }

  return (
    <div className="space-y-3 border-t border-line pt-3">
      {erreur && <p className="text-sm text-brand-red">{erreur}</p>}
      {liste === null && <p className="text-sm text-muted">Chargement…</p>}
      {liste && liste.length === 0 && !erreur && <p className="text-sm text-muted">Aucun commentaire pour l’instant.</p>}
      {(liste ?? []).map((c) => (
        <div key={c.id} className="rounded-xl bg-gold-500/10 px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <p className="flex-1 font-semibold">{c.auteurNom}</p>
            <span className="text-[11px] text-muted">{depuis(c.creeLe)}</span>
          </div>
          <p className="mt-0.5 whitespace-pre-line">{c.texte}</p>
          <div className="mt-1 flex items-center gap-3">
            {c.auteurUid !== user?.uid && (
              <SignalerBouton cibleType="reponse" cibleId={`${postId}_${c.id}`} cibleNom={`Commentaire de ${c.auteurNom}`} cibleUid={c.auteurUid} libelle="Signaler" className="text-[11px]" />
            )}
            {(admin || c.auteurUid === user?.uid || ownerUid === user?.uid) && (
              <button onClick={() => supprimer(c)} aria-label="Supprimer le commentaire" className="text-muted">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}
      <form onSubmit={envoyer} className="flex gap-2">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={MAX_COMMENTAIRE}
          placeholder="Écrire un commentaire…"
          className="w-full rounded-2xl border border-line bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        <button type="submit" disabled={busy || !texte.trim()} aria-label="Envoyer" className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gold-500 text-ink disabled:opacity-50">
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
