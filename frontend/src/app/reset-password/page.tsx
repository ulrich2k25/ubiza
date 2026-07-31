"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authService } from "@/features/auth/auth.service";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Le lien de réinitialisation est invalide.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      const response = await authService.resetPassword(token, password);

      setSuccess(response.message);

      window.setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de réinitialiser le mot de passe.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 text-white">
      <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-white">Ubi</span>
            <span className="text-fuchsia-500">za</span>
          </h1>

          <h2 className="mt-6 text-2xl font-bold">Nouveau mot de passe</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {!token ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Le lien de réinitialisation est invalide ou incomplet.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-zinc-300"
            >
              Nouveau mot de passe
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              disabled={isSubmitting || !token || Boolean(success)}
              autoComplete="new-password"
              placeholder="Au moins 8 caractères"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-zinc-600 transition focus:border-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="mb-2 block text-sm text-zinc-300"
            >
              Confirmer le mot de passe
            </label>

            <input
              id="password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              required
              minLength={8}
              disabled={isSubmitting || !token || Boolean(success)}
              autoComplete="new-password"
              placeholder="Saisissez le même mot de passe"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white outline-none placeholder:text-zinc-600 transition focus:border-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !token || Boolean(success)}
          className="mt-6 w-full rounded-2xl bg-fuchsia-600 py-4 font-bold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Réinitialisation..."
            : "Réinitialiser le mot de passe"}
        </button>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-semibold text-fuchsia-400 transition hover:text-fuchsia-300"
        >
          ← Retour à la connexion
        </Link>
      </form>
    </main>
  );
}

function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <p className="text-sm text-zinc-400">Chargement...</p>
    </main>
  );
}
