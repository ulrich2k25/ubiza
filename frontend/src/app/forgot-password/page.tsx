"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { authService } from "@/features/auth/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setIsSubmitting(true);

      await authService.forgotPassword(email);

      setSuccess(
        "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl"
      >
        <h1 className="text-3xl font-black">Mot de passe oublié</h1>

        <p className="mt-3 text-sm text-zinc-400">
          Saisissez votre adresse e-mail. Nous vous enverrons un lien pour
          choisir un nouveau mot de passe.
        </p>

        {success && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6">
          <label className="mb-2 block text-sm">Adresse e-mail</label>

          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none focus:border-fuchsia-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-2xl bg-fuchsia-600 py-4 font-bold transition hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {isSubmitting ? "Envoi..." : "Envoyer le lien"}
        </button>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300"
        >
          ← Retour à la connexion
        </Link>
      </form>
    </main>
  );
}
