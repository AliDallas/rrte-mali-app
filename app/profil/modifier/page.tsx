"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Fiche, cle, ficheDepuisDoc } from "@/lib/fiches";
import { reduireImage } from "@/lib/image";
import { viderCache } from "@/lib/cache";

const input =
  "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-500";

export default function ModifierFichePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "absente">("loading");
  const [f, setF] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [lien, setLien] = useState(false);

  async function charger() {
    if (!user) return;
    const r = await getDocs(query(collection(db, "fiches"), where("uid", "==", user.uid)));
    if (r.empty) return setState("absente");
    const x = ficheDepuisDoc(r.docs[0].id, r.docs[0].data());
    setFiche(x);
    setF({
      prenom: x.prenom,
      nom: x.nom,
      email: x.email,
      reseaux: x.reseaux,
      pays: x.pays,
      ville: x.ville,
      anciennete: x.anciennete,
      activite: x.activite,
      presentation: x.presentation,
      competences: x.competences,
      attentes: x.attentes,
      info: x.info,
      logo: x.logo,
    });
    setState("ok");
  }

  useEffect(() => {
    if (user && profile?.statut === "actif") charger().catch(() => setState("absente"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function choisirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("logo", await reduireImage(file, 160, 0.75));
    } catch {
      setMsg("Image illisible, essayez un autre fichier.");
    }
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!fiche) return;
    setSaving(true);
    setMsg("");
    try {
      const data: Record<string, string | boolean> = { aConfirmer: false };
      for (const [k, v] of Object.entries(f)) data[k] = v.trim();
      if (data.activite || data.competences) data.statutFiche = "Fiche complète";
      await updateDoc(doc(db, "fiches", fiche.id), data);
      viderCache("annuaire");
      router.push(`/annuaire/${fiche.id}`);
    } catch {
      setMsg("Impossible d’enregistrer. Réessayez dans un instant.");
      setSaving(false);
    }
  }

  // réservé aux administrateurs : relie leur compte à la fiche portant leur numéro
  async function relier() {
    if (!user || !profile?.telephone) return setMsg("Aucun numéro de téléphone sur votre compte.");
    setLien(true);
    try {
      const r = await getDocs(query(collection(db, "fiches"), where("cles", "array-contains", cle(profile.telephone))));
      if (r.empty) setMsg("Aucune fiche avec votre numéro dans l’annuaire.");
      else {
        await updateDoc(doc(db, "fiches", r.docs[0].id), { uid: user.uid });
        await charger();
      }
    } catch {
      setMsg("Impossible de relier la fiche.");
    } finally {
      setLien(false);
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
    <AppShell title="Ma fiche" subtitle="Modifier mes informations">
      <Link href="/profil" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Mon profil
      </Link>
      {state === "loading" && <p className="text-center text-muted">Chargement...</p>}
      {state === "absente" && (
        <div className="card space-y-3 p-6 text-center">
          <p className="text-muted">
            Votre compte n’est pas encore relié à une fiche de l’annuaire. Contactez un administrateur RRTE.
          </p>
          {profile?.role === "admin" && (
            <button onClick={relier} disabled={lien} className="btn-gold">
              Relier ma fiche (par mon numéro)
            </button>
          )}
          {msg && <p className="text-sm text-brand-red">{msg}</p>}
        </div>
      )}
      {state === "ok" && fiche && (
        <form onSubmit={enregistrer} className="space-y-4">
          <div className="card space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              {champ("prenom", "Prénom")}
              {champ("nom", "Nom")}
            </div>
            {champ("email", "Adresse e-mail")}
            {champ("reseaux", "Réseaux sociaux")}
            <div className="grid grid-cols-2 gap-3">
              {champ("pays", "Pays de résidence principale")}
              {champ("anciennete", "Au Mali depuis", { placeholder: "ex. 2018" })}
            </div>
            {champ("ville", "Quartier de résidence au Mali")}
            {champ("activite", "Domaine d’activité ou profession")}
            {champ("presentation", "Présentation de votre entreprise ou projet", { area: true })}
            {champ("competences", "Compétences", { area: true })}
            {champ("attentes", "Objectif, besoin, centre d’intérêt", { area: true })}
            {champ("info", "Informations complémentaires", { area: true })}
            <div className="text-sm font-medium">
              Logo
              <div className="mt-1.5 flex items-center gap-3">
                {f.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.logo} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
                )}
                <input type="file" accept="image/*" onChange={choisirLogo} className="text-sm" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">
            Votre numéro de téléphone sert à vous identifier : pour le changer, contactez un administrateur.
          </p>
          {msg && <p className="text-sm text-brand-red">{msg}</p>}
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Enregistrement..." : "Enregistrer ma fiche"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
