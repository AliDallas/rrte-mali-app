"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import BrandStrip from "@/components/BrandStrip";

export default function SignupPage() {
  const { signup } = useAuth();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, nom, prenom, telephone);
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
          Mot de passe
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-dark mt-1.5" />
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
