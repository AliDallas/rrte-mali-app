"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, chiffres, cle, ficheDepuisDoc, nomComplet } from "@/lib/fiches";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

/** Correction d'une fiche par un administrateur (numéros de téléphone compris). */
export default function AdminModifierFichePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [etat, setEtat] = useState<"loading" | "ok" | "absente">("loading");
  const [f, setF] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirme, setConfirme] = useState<"" | "retirer" | "fiche">("");

  useEffect(() => {
    if (!id || !isAdmin) return;
    getDoc(doc(db, "fiches", id))
      .then((snap) => {
        if (!snap.exists()) return setEtat("absente");
        const x = ficheDepuisDoc(snap.id, snap.data());
        setFiche(x);
        setF({
          prenom: x.prenom,
          nom: x.nom,
          tel1: x.tels[0] ?? "",
          tel2: x.tels[1] ?? "",
          tel3: x.tels[2] ?? "",
          email: x.email,
          reseaux: x.reseaux,
          pays: x.pays,
          ville: x.ville,
          anciennete: x.anciennete,
          activite: x.activite,
          presentation: x.presentation,
          competences: x.competences,
          attentes: x.attentes,
          cherche: x.cherche,
          propose: x.propose,
          info: x.info,
        });
        setEtat("ok");
      })
      .catch(() => setEtat("absente"));
  }, [id, isAdmin]);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!fiche) return;
    setSaving(true);
    setMsg("");
    try {
      const t = (k: string) => (f[k] ?? "").trim();
      const tels = [t("tel1"), t("tel2"), t("tel3")].filter(Boolean);
      const { tel1: _a, tel2: _b, tel3: _c, ...reste } = f;
      void _a; void _b; void _c;
      const donnees: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(reste)) donnees[k] = v.trim();
      donnees.tels = tels;
      donnees.cles = tels.map(cle).filter((c) => c.length >= 8);
      donnees.majLe = Date.now();

      const nouvelId = chiffres(tels[0] ?? "") || fiche.id;
      if (nouvelId !== fiche.id) {
        // le premier numéro a changé : la fiche change d'identifiant (pas de doublon avec un numéro déjà utilisé)
        const deja = await getDoc(doc(db, "fiches", nouvelId));
        if (deja.exists()) {
          setMsg(`Ce numéro est déjà utilisé par la fiche de ${nomComplet(ficheDepuisDoc(deja.id, deja.data()))}.`);
          setSaving(false);
          return;
        }
        const ancien = await getDoc(doc(db, "fiches", fiche.id));
        await setDoc(doc(db, "fiches", nouvelId), { ...ancien.data(), ...donnees });
        await deleteDoc(doc(db, "fiches", fiche.id));
      } else {
        await updateDoc(doc(db, "fiches", fiche.id), donnees);
      }
      if (fiche.uid) await updateDoc(doc(db, "users", fiche.uid), { telephone: tels[0] ?? "" }).catch(() => undefined);
      viderCache("annuaire");
      router.push(`/annuaire/${nouvelId}`);
    } catch {
      setMsg("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  async function supprimer(retirer: boolean) {
    if (!fiche) return;
    setMsg("");
    try {
      if (retirer && fiche.uid) {
        if (fiche.uid === user?.uid) return setMsg("Vous ne pouvez pas vous retirer vous-même.");
        const u = await getDoc(doc(db, "users", fiche.uid));
        if (u.exists() && u.data().role === "admin")
          return setMsg("Ce membre est administrateur : retirez d’abord son rôle dans « Administrateurs ».");
        await updateDoc(doc(db, "users", fiche.uid), { statut: "radie" });
      }
      await deleteDoc(doc(db, "fiches", fiche.id));
      viderCache("annuaire");
      router.push("/annuaire");
    } catch {
      setMsg("Impossible de terminer l’opération. Réessayez.");
    }
  }

  const champ = (k: string, label: string, props: { area?: boolean; placeholder?: string } = {}) => (
    <label className="block text-sm font-medium">
      {label}
      {props.area ? (
        <textarea rows={3} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={input} />
      ) : (
        <input value={f[k] ?? ""} placeholder={props.placeholder} onChange={(e) => set(k, e.target.value)} className={input} />
      )}
    </label>
  );

  return (
    <AppShell title="Corriger la fiche" subtitle="Réservé aux administrateurs">
      <Link href={id ? `/annuaire/${id}` : "/annuaire"} className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Retour à la fiche
      </Link>
      {!isAdmin ? (
        <p className="card p-6 text-center text-muted">Cette page est réservée aux administrateurs.</p>
      ) : etat === "loading" ? (
        <p className="text-center text-muted">Chargement...</p>
      ) : etat === "absente" ? (
        <p className="card p-6 text-center text-muted">Fiche introuvable.</p>
      ) : (
        <form onSubmit={enregistrer} className="space-y-4">
          <div className="card space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              {champ("prenom", "Prénom")}
              {champ("nom", "Nom")}
            </div>
            {champ("tel1", "Téléphone principal", { placeholder: "+223 …" })}
            {champ("tel2", "Téléphone 2", { placeholder: "+223 …" })}
            {champ("tel3", "Téléphone 3", { placeholder: "+223 …" })}
            {champ("email", "Adresse e-mail")}
            {champ("reseaux", "Réseaux sociaux")}
            <div className="grid grid-cols-2 gap-3">
              {champ("pays", "Pays de résidence")}
              {champ("anciennete", "Au Mali depuis")}
            </div>
            {champ("ville", "Quartier")}
            {champ("activite", "Activité ou profession")}
            {champ("presentation", "Entreprise ou projet", { area: true })}
            {champ("competences", "Compétences", { area: true })}
            {champ("attentes", "Objectif, besoin, centre d’intérêt", { area: true })}
            {champ("cherche", "Je cherche…")}
            {champ("propose", "Je propose…")}
            {champ("info", "Informations complémentaires", { area: true })}
          </div>
          {fiche?.uid && (
            <p className="text-xs text-muted">
              Ce membre a un compte : son numéro de profil sera mis à jour avec le téléphone principal.
            </p>
          )}
          {msg && <p className="text-sm text-brand-red">{msg}</p>}
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Enregistrement..." : "Enregistrer les corrections"}
          </button>

          <div className="card space-y-3 p-4">
            <p className="text-sm font-semibold">Retirer ce membre</p>
            {confirme === "retirer" ? (
              <div className="space-y-2">
                <p className="text-sm">
                  La fiche sera supprimée de l’annuaire{fiche?.uid ? " et l’accès du membre à l’application sera retiré" : ""}. Confirmer ?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => supprimer(true)} className="rounded-full bg-brand-red px-3 py-1.5 text-sm font-semibold text-white">
                    Oui, retirer du groupe
                  </button>
                  <button type="button" onClick={() => setConfirme("")} className="rounded-full border border-line px-3 py-1.5 text-sm">
                    Annuler
                  </button>
                </div>
              </div>
            ) : confirme === "fiche" ? (
              <div className="space-y-2">
                <p className="text-sm">Seule la fiche sera supprimée (doublon ou erreur). Le compte, s’il existe, reste actif. Confirmer ?</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => supprimer(false)} className="rounded-full bg-brand-red px-3 py-1.5 text-sm font-semibold text-white">
                    Oui, supprimer la fiche
                  </button>
                  <button type="button" onClick={() => setConfirme("")} className="rounded-full border border-line px-3 py-1.5 text-sm">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setConfirme("retirer")} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-brand-red">
                  A quitté le groupe / radié
                </button>
                <button type="button" onClick={() => setConfirme("fiche")} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm text-muted">
                  Doublon ou erreur
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </AppShell>
  );
}
