"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { FicheSaisie } from "./fiches";
import type { EntrepriseSaisie } from "./entreprises";

export interface MemberProfile {
  uid: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  photo?: string;
  fiche?: FicheSaisie;
  entreprises?: EntrepriseSaisie[];
  reglementAccepteLe?: number;
  role: "member" | "admin";
  statut: "en_attente" | "actif" | "refuse" | "radie";
  createdAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  profilFrais: boolean;
  signup: (email: string, password: string, nom: string, prenom: string, telephone: string, fiche: FicheSaisie, entreprises: EntrepriseSaisie[]) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // vrai quand le profil vient du serveur (et non seulement de la copie gardée sur l'appareil)
  const [profilFrais, setProfilFrais] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfilFrais(false);
      if (firebaseUser) {
        try {
          const c = localStorage.getItem(`rrte-profil-${firebaseUser.uid}`);
          if (c) {
            setProfile(JSON.parse(c) as MemberProfile);
            setLoading(false);
          }
        } catch {
          /* cache indisponible : on attend le serveur */
        }
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) {
          const p = snap.data() as MemberProfile;
          setProfile(p);
          setProfilFrais(true);
          try {
            const { fiche, entreprises, ...leger } = p;
            void fiche;
            void entreprises;
            localStorage.setItem(`rrte-profil-${firebaseUser.uid}`, JSON.stringify(leger));
          } catch {
            /* ignoré */
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function signup(email: string, password: string, nom: string, prenom: string, telephone: string, fiche: FicheSaisie, entreprises: EntrepriseSaisie[]) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      nom,
      prenom,
      telephone,
      fiche,
      photo: fiche.photo || "",
      entreprises,
      role: "member",
      statut: "en_attente", // en attente d'approbation admin
      reglementAccepteLe: Date.now(), // la case d'acceptation du règlement est obligatoire à l'inscription
      createdAt: serverTimestamp(),
    });
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function refreshProfile() {
    if (!auth.currentUser) return;
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (snap.exists()) {
      const p = snap.data() as MemberProfile;
      setProfile(p);
      setProfilFrais(true);
      try {
        const { fiche, entreprises, ...leger } = p;
        void fiche;
        void entreprises;
        localStorage.setItem(`rrte-profil-${auth.currentUser.uid}`, JSON.stringify(leger));
      } catch {
        /* ignoré */
      }
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profilFrais, signup, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
