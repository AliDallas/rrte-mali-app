"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import Logo from "@/components/Logo";
import BrandStrip from "@/components/BrandStrip";
import { Eye, EyeOff } from "lucide-react";
import { LIEN_CONTACT } from "@/lib/contact";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [voir, setVoir] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/accueil");
    } catch {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-ink text-ink-fg">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-7 py-10"
      >
        <div className="mb-3 flex flex-col items-center gap-3">
          <Link href="/">
            <Logo size={120} />
          </Link>
          <h1 className="font-display text-2xl font-bold">Connexion</h1>
        </div>

        {error && (
          <div className="rounded-xl bg-brand-red/20 p-3 text-sm text-[#F0897B]">{error}</div>
        )}

        <label className="block text-sm text-ink-mute">
          Adresse e-mail
          <input
            type="email"
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-dark mt-1.5"
            placeholder="vous@exemple.com"
          />
        </label>
        <label className="block text-sm text-ink-mute">
          Mot de passe
          <div className="relative">
            <input
              type={voir ? "text" : "password"}
              required
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-dark mt-1.5 pr-12"
            />
            <button
              type="button"
              onClick={() => setVoir(!voir)}
              aria-label={voir ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute"
            >
              {voir ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </label>

        <Link href="/mot-de-passe-oublie" className="-mt-1 text-right text-sm text-gold-500">
          Mot de passe oublié ?
        </Link>

        <button type="submit" disabled={loading} className="btn-gold mt-2">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <Link href="/signup" className="btn-outline">
          Demander l’accès
        </Link>
        <a href={LIEN_CONTACT} className="mt-1 text-center text-sm text-ink-mute underline">
          Une question ? Nous contacter
        </a>
      </form>
      <BrandStrip />
    </main>
  );
}
