"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Badges from "@/components/Badges";
import { ficheComplete, ficheIncomplete, ficheDepuisDoc, nouveauMembre } from "@/lib/fiches";
import { ScrollText, LogOut, ShieldCheck, ChevronRight, Mail, Pencil, UserMinus } from "lucide-react";
import AppShell from "@/components/AppShell";
import NousContacter from "@/components/NousContacter";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/AuthContext";

export default function ProfilPage() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [incomplete, setIncomplete] = useState(false);
  const [badgeComplet, setBadgeComplet] = useState(false);
  const [badgeNouveau, setBadgeNouveau] = useState(false);
  const [enAttente, setEnAttente] = useState(0);
  const uid = profile?.uid;
  const admin = profile?.role === "admin";

  useEffect(() => {
    if (!uid) return;
    getDocs(query(collection(db, "fiches"), where("uid", "==", uid)))
      .then((r) => {
        if (r.empty) return;
        const f = ficheDepuisDoc(r.docs[0].id, r.docs[0].data());
        setIncomplete(ficheIncomplete(f));
        setBadgeComplet(ficheComplete(f));
        setBadgeNouveau(nouveauMembre(f));
      })
      .catch(() => undefined);
    if (admin) {
      getDocs(query(collection(db, "users"), where("statut", "==", "en_attente")))
        .then((r) => setEnAttente(r.size))
        .catch(() => undefined);
    }
  }, [uid, admin]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <AppShell title="Mon profil" subtitle="Votre fiche dans la communauté">
      <div className="card mb-4 flex items-center gap-4 p-4">
        <Avatar prenom={profile?.prenom} nom={profile?.nom} size={64} photo={profile?.photo} />
        <div className="min-w-0">
          <p className="font-display text-xl font-bold">
            {profile?.prenom} {profile?.nom}
          </p>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted">
            <Mail size={14} /> {profile?.email}
          </p>
          <div className="mt-1.5"><Badges admin={admin} compact complete={badgeComplet} nouveau={badgeNouveau} /></div>
        </div>
      </div>

      {incomplete && (
        <Link href="/profil/modifier" className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-red/30 bg-brand-red/5 p-4">
          <Pencil size={20} className="text-brand-red" strokeWidth={1.75} />
          <span className="flex-1 text-sm font-semibold">Votre fiche est à compléter : ajoutez votre activité et vos compétences.</span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <Link href="/profil/modifier" className="card mb-4 flex items-center gap-3 p-4">
        <Pencil size={20} className="text-gold-700" strokeWidth={1.75} />
        <span className="flex-1 font-semibold">Modifier ma fiche de renseignements</span>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      {profile?.role === "admin" && (
        <Link href="/admin" className="card mb-4 flex items-center gap-3 p-4">
          <ShieldCheck size={20} className="text-gold-700" strokeWidth={1.75} />
          <span className="flex-1 font-semibold">Administration</span>
          {enAttente > 0 && (
            <span className="rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-bold text-white">
              {enAttente} inscription{enAttente > 1 ? "s" : ""} à valider
            </span>
          )}
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <Link href="/reglement" className="card mb-4 flex items-center gap-3 p-4">
        <ScrollText size={20} className="text-gold-700" strokeWidth={1.75} />
        <span className="flex-1 font-semibold">Le groupe et son règlement</span>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      <Link href="/confidentialite" className="card mb-4 flex items-center gap-3 p-4">
        <ScrollText size={20} className="text-gold-700" strokeWidth={1.75} />
        <span className="flex-1 font-semibold">Confidentialité et vos données</span>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      <div className="mb-4">
        <NousContacter />
      </div>

      <button onClick={handleLogout} className="card flex w-full items-center gap-3 p-4 text-left">
        <LogOut size={20} className="text-muted" strokeWidth={1.75} />
        <span className="font-semibold">Se déconnecter</span>
      </button>

      <Link href="/profil/quitter" className="mt-4 flex items-center justify-center gap-2 p-3 text-sm text-muted underline">
        <UserMinus size={16} strokeWidth={1.75} /> Quitter le groupe RRTE
      </Link>
    </AppShell>
  );
}
