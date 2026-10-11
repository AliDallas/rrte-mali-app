"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Logo from "@/components/Logo";
import BrandStrip from "@/components/BrandStrip";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      auth.languageCode = "fr";
      await sendPasswordResetEmail(auth, email.trim());
      setEnvoye(true);
    } catch (err) {
      const code = (err as { code?: string })?.code || "";
      if (code === "auth/user-not-found") {
        // on ne révèle pas si l'adresse existe
        setEnvoye(true);
      } else if (code === "auth/invalid-email") {
        setError("Adresse e-mail invalide.");
      } else {
        setError("Impossible d’envoyer le message pour le moment. Réessayez dans un instant.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-7 py-10">
        <div className="mb-3 flex flex-col items-center gap-3">
          <Link href="/">
            <Logo size={120} />
          </Link>
          <h1 className="font-display text-2xl font-bold">Mot de passe oublié</h1>
        </div>

        {envoye ? (
          <>
            <div className="rounded-xl bg-gold-500/15 p-4 text-sm text-ink-fg">
              Si cette adresse correspond à un compte, un e-mail vient d’être envoyé avec un lien pour choisir un nouveau
              mot de passe. Pensez à vérifier vos courriers indésirables (spam).
            </div>
            <Link href="/login" className="btn-gold">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-mute">
              Entrez l’adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.
            </p>
            {error && <div className="rounded-xl bg-brand-red/20 p-3 text-sm text-[#F0897B]">{error}</div>}
            <label className="block text-sm text-ink-mute">
              Adresse e-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-dark mt-1.5"
                placeholder="vous@exemple.com"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-gold mt-2">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
            <Link href="/login" className="btn-outline">
              Retour
            </Link>
          </>
        )}
      </form>
      <BrandStrip />
    </main>
  );
}
