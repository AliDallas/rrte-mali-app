"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import BrandStrip from "@/components/BrandStrip";
import { reduireImage } from "@/lib/image";
import EntrepriseForm from "@/components/EntrepriseForm";
import { EntrepriseSaisie, saisieVide } from "@/lib/entreprises";

export default function SignupPage() {
  const { signup } = useAuth();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reseaux, setReseaux] = useState("");
  const [pays, setPays] = useState("");
  const [quartier, setQuartier] = useState("");
  const [anneeRetour, setAnneeRetour] = useState("");
  const [activite, setActivite] = useState("");
  const [presentation, setPresentation] = useState("");
  const [logo, setLogo] = useState("");
  const [photo, setPhoto] = useState("");
  const [competences, setCompetences] = useState("");
  const [objectif, setObjectif] = useState("");
  const [entreprises, setEntreprises] = useState<EntrepriseSaisie[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function choisirLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setLogo(await reduireImage(f, 160, 0.75));
    } catch {
      setError("Image illisible, essayez un autre fichier.");
    }
  }

  async function choisirPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPhoto(await reduireImage(f, 128, 0.72));
    } catch {
      setError("Image illisible, essayez un autre fichier.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (JSON.stringify([logo, photo, entreprises]).length > 800000) {
      setError("Les photos sont trop lourdes : retirez-en quelques-unes (vous pourrez les ajouter ensuite dans l’application).");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, nom.trim(), prenom.trim(), telephone.trim(), {
        reseaux: reseaux.trim(),
        pays: pays.trim(),
        quartier: quartier.trim(),
        anneeRetour: anneeRetour.trim(),
        activite: activite.trim(),
        presentation: presentation.trim(),
        logo,
        photo,
        competences: competences.trim(),
        objectif: objectif.trim(),
      }, entreprises.filter((x) => x.nom.trim()));
      setSuccess(true);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") setError("Cette adresse e-mail est déjà inscrite.");
      else if (code === "auth/weak-password") setError("Mot de passe trop court (6 caractères minimum).");
      else setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
          <Logo size={96} />
          <h1 className="font-display text-2xl font-bold">Inscription reçue</h1>
          <p className="text-ink-mute">
            Un e-mail de confirmation vous a été envoyé. Une fois votre adresse confirmée, un
            administrateur examinera votre demande avant l’activation de votre accès.
          </p>
          <Link href="/" className="btn-gold mt-3 max-w-xs">
            Retour à l’accueil
          </Link>
        </div>
        <BrandStrip />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-7 py-10"
      >
        <div className="mb-2 flex flex-col items-center gap-3 text-center">
          <Link href="/">
            <Logo size={96} />
          </Link>
          <h1 className="font-display text-2xl font-bold">Rejoindre RRTE</h1>
          <p className="text-sm text-ink-mute">
            Réservé aux membres du groupe RRTE au Mali. Votre inscription est validée par un
            administrateur.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-brand-red/20 p-3 text-sm text-[#F0897B]">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-ink-mute">
            Prénom
            <input required value={prenom} onChange={(e) => setPrenom(e.target.value)} className="field-dark mt-1.5" />
          </label>
          <label className="block text-sm text-ink-mute">
            Nom
            <input required value={nom} onChange={(e) => setNom(e.target.value)} className="field-dark mt-1.5" />
          </label>
        </div>
        <label className="block text-sm text-ink-mute">
          Numéro de téléphone (celui du groupe WhatsApp)
          <input type="tel" required autoComplete="tel" placeholder="+223 …" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Adresse e-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Photo de profil (facultatif)
          <input type="file" accept="image/*" onChange={choisirPhoto} className="mt-1.5 block w-full text-sm" />
          {photo && <img src={photo} alt="Aperçu" className="mt-2 h-20 w-20 rounded-full object-cover" />}
        </label>
        <label className="block text-sm text-ink-mute">
          Réseaux sociaux (Facebook, Instagram…)
          <input value={reseaux} onChange={(e) => setReseaux(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-ink-mute">
            Pays de résidence principale
            <input value={pays} onChange={(e) => setPays(e.target.value)} className="field-dark mt-1.5" />
          </label>
          <label className="block text-sm text-ink-mute">
            Année de retour au Mali
            <input inputMode="numeric" placeholder="ex. 2018" value={anneeRetour} onChange={(e) => setAnneeRetour(e.target.value)} className="field-dark mt-1.5" />
          </label>
        </div>
        <label className="block text-sm text-ink-mute">
          Quartier de résidence au Mali
          <input value={quartier} onChange={(e) => setQuartier(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Domaine d’activité ou profession
          <input value={activite} onChange={(e) => setActivite(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Présentation de votre entreprise ou projet en cours
          <textarea rows={3} value={presentation} onChange={(e) => setPresentation(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Logo (facultatif)
          <input type="file" accept="image/*" onChange={choisirLogo} className="mt-1.5 block w-full text-sm" />
          {logo && <img src={logo} alt="Aperçu du logo" className="mt-2 h-16 w-16 rounded-lg object-cover" />}
        </label>
        <label className="block text-sm text-ink-mute">
          Compétences
          <textarea rows={2} value={competences} onChange={(e) => setCompetences(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <label className="block text-sm text-ink-mute">
          Objectif, besoin, centre d’intérêt
          <textarea rows={2} value={objectif} onChange={(e) => setObjectif(e.target.value)} className="field-dark mt-1.5" />
        </label>
        <div className="space-y-3 rounded-2xl border border-[#454A50] p-4">
          <p className="text-sm font-semibold">Vos entreprises (facultatif)</p>
          <p className="text-xs text-ink-mute">
            Jusqu’à 5 entreprises, reliées à votre numéro. Vous pourrez compléter les photos et en ajouter ensuite dans l’application.
          </p>
          {entreprises.map((ent, i) => (
            <div key={i} className="space-y-3 border-t border-[#454A50] pt-3">
              <EntrepriseForm
                sombre
                maxPhotos={2}
                value={ent}
                onChange={(v) => setEntreprises((l) => l.map((x, j) => (j === i ? v : x)))}
              />
              <button
                type="button"
                onClick={() => setEntreprises((l) => l.filter((_, j) => j !== i))}
                className="text-sm text-[#F0897B]"
              >
                Retirer cette entreprise
              </button>
            </div>
          ))}
          {entreprises.length < 5 && (
            <button
              type="button"
              onClick={() => setEntreprises((l) => [...l, saisieVide("proprietaire")])}
              className="btn-outline"
            >
              + Ajouter une entreprise
            </button>
          )}
        </div>
        <label className="block text-sm text-ink-mute">
          Mot de passe
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-dark mt-1.5" />
        </label>

        <label className="flex items-start gap-2 text-sm text-ink-mute">
          <input type="checkbox" required className="mt-1" />
          <span>
            J’ai lu et j’accepte le{" "}
            <a href="/reglement" target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-500 underline">
              règlement du groupe
            </a>
            .
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn-gold mt-2">
          {loading ? "Envoi..." : "Envoyer ma demande"}
        </button>
        <p className="text-center text-sm text-ink-mute">
          Déjà membre ?{" "}
          <Link href="/login" className="font-semibold text-gold-500">
            Se connecter
          </Link>
        </p>
      </form>
      <BrandStrip />
    </main>
  );
}
