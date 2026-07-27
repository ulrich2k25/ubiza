"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authService } from "@/features/auth/auth.service";
import { listingService } from "@/services/listing.service";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);

      await authService.login({
        email,
        password,
      });

      await refreshAuth();

      const returnUrl = searchParams.get("returnUrl");

      if (returnUrl?.startsWith("/")) {
        router.replace(returnUrl);
        return;
      }

      try {
        const listing = await listingService.getMyListing();

        if (listing) {
          router.replace("/dashboard");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la connexion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRegisterRedirect() {
    const returnUrl = searchParams.get("returnUrl");

    router.push(
      returnUrl
        ? `/register?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/register",
    );
  }

  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-black
        px-5
        text-white
      "
    >
      <div
        className="
          absolute
          left-1/2
          top-20
          h-96
          w-96
          -translate-x-1/2
          rounded-full
          bg-fuchsia-600/20
          blur-3xl
        "
      />

      <form
        onSubmit={handleLogin}
        className="
          relative
          w-full
          max-w-md
          space-y-6
          rounded-3xl
          border
          border-white/10
          bg-white/[0.04]
          p-8
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-white">Ubi</span>
            <span className="text-fuchsia-500">za</span>
          </h1>

          <h2 className="mt-6 text-2xl font-bold">Bienvenue 👋</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Connecte-toi pour continuer ton expérience Ubiza.
          </p>
        </div>

        {error ? (
          <div
            className="
              rounded-2xl
              border
              border-red-500/20
              bg-red-500/10
              px-4
              py-3
              text-sm
              text-red-300
            "
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-zinc-300">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="email"
              className="
                w-full
                rounded-2xl
                border
                border-white/10
                bg-black/40
                px-5
                py-4
                text-white
                outline-none
                placeholder:text-zinc-600
                transition
                focus:border-fuchsia-500
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm text-zinc-300"
            >
              Mot de passe
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              className="
                w-full
                rounded-2xl
                border
                border-white/10
                bg-black/40
                px-5
                py-4
                text-white
                outline-none
                placeholder:text-zinc-600
                transition
                focus:border-fuchsia-500
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="
            w-full
            rounded-2xl
            bg-fuchsia-600
            py-4
            font-bold
            text-white
            transition
            hover:bg-fuchsia-500
            hover:shadow-lg
            hover:shadow-fuchsia-500/20
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {isSubmitting ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center text-sm text-zinc-400">
          Pas encore de compte ?
          <button
            type="button"
            onClick={handleRegisterRedirect}
            className="
              ml-2
              font-semibold
              text-fuchsia-400
              hover:text-fuchsia-300
            "
          >
            Créer un compte
          </button>
        </p>
      </form>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      Chargement...
    </main>
  );
}
