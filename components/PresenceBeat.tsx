"use client";

import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const INTERVALLE_MS = 5 * 60 * 1000;
const MINIMUM_MS = 2 * 60 * 1000;

/** Enregistre discrètement « vu à telle heure » pour un membre actif (visible des administrateurs seulement). */
export default function PresenceBeat() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const actif = profile?.statut === "actif";
  const nom = `${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim();

  useEffect(() => {
    if (!uid || !actif) return;
    let dernier = 0;
    const battre = () => {
      if (document.visibilityState !== "visible" || Date.now() - dernier < MINIMUM_MS) return;
      dernier = Date.now();
      setDoc(doc(db, "presence", uid), { uid, nom, vuLe: serverTimestamp() }).catch(() => undefined);
    };
    battre();
    const t = setInterval(battre, INTERVALLE_MS);
    document.addEventListener("visibilitychange", battre);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", battre);
    };
  }, [uid, actif, nom]);

  return null;
}
