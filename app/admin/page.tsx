"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { Check, FileSpreadsheet, ShieldCheck, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { db } from "@/lib/firebase";
import { useAuth, MemberProfile } from "@/lib/AuthContext";
import { Entreprise, enregistrerPhotos, entrepriseDepuisDoc, saisieVersDoc } from "@/lib/entreprises";
import { viderCache } from "@/lib/cache";
import CopierPresentation from "@/components/CopierPresentation";
import { DonneesPresentation, donneesDepuisInscription, donneesDepuisFiche } from "@/lib/presentation";
import { chiffres, cle, nomComplet, ficheDepuisDoc, Fiche } from "@/lib/fiches";

export default function AdminPage() {
  const { profile } = useAuth();
  const [pending, setPending] = useState<MemberProfile[]>([]);
  const [liens, setLiens] = useState<Record<string, Fiche>>({});
  const [entAttente, setEntAttente] = useState<Entreprise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [valides, setValides] = useState<DonneesPresentation[]>([]);
  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const snap = await getDocs(query(collection(db, "users"), where("statut", "==", "en_attente")));
    const list = snap.docs.map((d) => d.data() as MemberProfile);
    setPending(list);
    // rapprochement automatique avec l'annuaire importé, par numéro de téléphone
    const trouves: Record<string, Fiche> = {};
    await Promise.all(
      list.map(async (m) => {
        const k = m.telephone ? cle(m.telephone) : "";
        if (k.length < 8) return;
        const r = await getDocs(query(collection(db, "fiches"), where("cles", "array-contains", k)));
        if (!r.empty) trouves[m.uid] = ficheDepuisDoc(r.docs[0].id, r.docs[0].data());
      })
    );
    setLiens(trouves);
    const ents = await getDocs(query(collection(db, "entreprises"), where("statut", "==", "en_attente")));
    setEntAttente(ents.docs.map((d) => entrepriseDepuisDoc(d.id, d.data())));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (isAdmin) load().catch(() => setLoaded(true));
  }, [isAdmin, load]);

  async function decide(uid: string, statut: "actif" | "refuse") {
    setBusy(uid);
    try {
      const m = pending.find((x) => x.uid === uid);
      if (statut === "actif" && m) {
        // la fiche saisie à l'inscription alimente l'annuaire (sans créer de doublon)
        const f = m.fiche;
        const tel = m.telephone || "";
        const donnees: Record<string, unknown> = { uid, email: m.email, statutFiche: "Fiche complète", aConfirmer: false, inscritLe: Date.now() };
        const mettre = (k: string, v?: string) => {
          if (v && v.trim()) donnees[k] = v.trim();
        };
        if (f) {
          mettre("reseaux", f.reseaux);
          mettre("pays", f.pays);
          mettre("ville", f.quartier);
          mettre("anciennete", f.anneeRetour);
          mettre("activite", f.activite);
          mettre("presentation", f.presentation);
          mettre("logo", f.logo);
          mettre("photo", f.photo);
          viderCache("annuaire");
          mettre("competences", f.competences);
          mettre("attentes", f.objectif);
        }
        const existante = liens[uid];
        if (existante) {
          await setDoc(doc(db, "fiches", existante.id), donnees, { merge: true });
        } else {
          const id = chiffres(tel) || uid;
          await setDoc(
            doc(db, "fiches", id),
            { ...donnees, nom: m.nom, prenom: m.prenom, tels: tel ? [tel] : [], cles: tel ? [cle(tel)] : [], info: "" },
            { merge: true }
          );
        }
      }
      if (statut === "actif" && m?.entreprises?.length) {
        // les entreprises saisies à l'inscription sont publiées d'office (l'admin vient de valider la personne)
        for (const ent of m.entreprises) {
          if (!ent.nom?.trim()) continue;
          const ref = await addDoc(collection(db, "entreprises"), {
            ...saisieVersDoc(ent),
            ownerUid: uid,
            ownerNom: `${m.prenom} ${m.nom}`.trim(),
            statut: "publie",
            createdAt: serverTimestamp(),
          });
          const vignette = await enregistrerPhotos(ref.id, ent.photos ?? []);
          await updateDoc(ref, { vignette });
        }
        viderCache("entreprises");
      }
      await updateDoc(doc(db, "users", uid), { statut });
      if (statut === "actif" && m) setValides((l) => [donneesDepuisInscription(m, liens[uid]), ...l]);
      setPending((p) => p.filter((x) => x.uid !== uid));
    } finally {
      setBusy(null);
    }
  }

  async function decideEnt(id: string, publier: boolean) {
    setBusy(id);
    try {
      if (publier) await updateDoc(doc(db, "entreprises", id), { statut: "publie" });
      else await deleteDoc(doc(db, "entreprises", id));
      setEntAttente((l) => l.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Administration" subtitle="Valider les inscriptions">
      {isAdmin && (
        <Link href="/admin/administrateurs" className="card mb-4 flex items-center gap-3 p-4">
          <ShieldCheck className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Administrateurs</p>
            <p className="text-xs text-muted">Nommer ou retirer un administrateur</p>
          </div>
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin/import" className="card mb-4 flex items-center gap-3 p-4">
          <FileSpreadsheet className="text-gold-600" size={22} strokeWidth={1.75} />
          <div className="flex-1">
            <p className="font-semibold">Importer l’annuaire</p>
            <p className="text-xs text-muted">Charger le fichier des membres (CSV)</p>
          </div>
        </Link>
      )}
      {isAdmin && valides.length > 0 && (
        <div className="mb-5 space-y-3">
          <h2 className="font-display text-lg font-bold">Membres validés : à annoncer dans le groupe</h2>
          {valides.map((v, i) => (
            <div key={i} className="card border-2 border-emerald-500 p-4">
              <p className="font-semibold">{`${v.prenom} ${v.nom}`.trim()}</p>
              <CopierPresentation donnees={v} />
            </div>
          ))}
        </div>
      )}
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : !loaded ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : pending.length === 0 ? (
        <p className="card p-6 text-center text-muted">Aucune demande en attente.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((m) => (
            <div key={m.uid} className="card flex items-start gap-3 p-4">
              <Avatar prenom={m.prenom} nom={m.nom} size={44} photo={m.photo} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {m.prenom} {m.nom}
                </p>
                <p className="truncate text-sm text-muted">{m.email}</p>
                {m.telephone && <p className="truncate text-sm text-muted">{m.telephone}</p>}
                {m.fiche && (m.fiche.activite || m.fiche.pays) && (
                  <p className="mt-1 text-sm">
                    {[m.fiche.activite, m.fiche.quartier, m.fiche.pays].filter(Boolean).join(" · ")}
                  </p>
                )}
                {liens[m.uid] ? (
                  <p className="mt-1 text-xs font-semibold text-[#3C7026]">
                    Fiche trouvée : {nomComplet(liens[m.uid])}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-brand-red">Aucune fiche avec ce numéro</p>
                )}
                <CopierPresentation donnees={donneesDepuisInscription(m, liens[m.uid])} />
              </div>
              <button
                disabled={busy === m.uid}
                onClick={() => decide(m.uid, "refuse")}
                aria-label="Refuser"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
              >
                <X size={18} />
              </button>
              <button
                disabled={busy === m.uid}
                onClick={() => decide(m.uid, "actif")}
                aria-label="Approuver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
              >
                <Check size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      {isAdmin && loaded && entAttente.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Entreprises à valider</h2>
          <div className="space-y-3">
            {entAttente.map((x) => (
              <div key={x.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/entreprises/${x.id}`} className="font-semibold underline">
                    {x.nom}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {[x.categorie, x.type === "recommandation" ? `recommandée par ${x.ownerNom}` : `ajoutée par ${x.ownerNom}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideEnt(x.id, false)}
                  aria-label="Refuser"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:border-brand-red hover:text-brand-red disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                <button
                  disabled={busy === x.id}
                  onClick={() => decideEnt(x.id, true)}
                  aria-label="Publier"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-ink hover:bg-gold-600 disabled:opacity-50"
                >
                  <Check size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
