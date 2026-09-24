"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authService } from "@/features/auth/auth.service";
import { authService as sessionAuthService } from "@/services/auth.service";
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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);

      await authService.login({
        identifier: identifier.trim(),
        password,
      });

      const currentUser = await sessionAuthService.me();

      await refreshAuth();

      const returnUrl = searchParams.get("returnUrl");

      if (
        returnUrl &&
        returnUrl.startsWith("/") &&
        !returnUrl.startsWith("//")
      ) {
        router.replace(returnUrl);
        return;
      }

      if (currentUser.role === "ADMIN") {
        router.replace("/admin");
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
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm text-zinc-300"
            >
              Email ou pseudo
            </label>

            <input
              id="identifier"
              type="text"
              placeholder="Email ou pseudo"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="username"
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
            <div className="mb-2 flex items-center justify-between gap-4">
              <label htmlFor="password" className="text-sm text-zinc-300">
                Mot de passe
              </label>

              <Link
                href="/forgot-password"
                className="
                  text-sm
                  font-semibold
                  text-fuchsia-400
                  transition
                  hover:text-fuchsia-300
                "
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
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
                  pr-20
                  text-white
                  outline-none
                  placeholder:text-zinc-600
                  transition
                  focus:border-fuchsia-500
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                disabled={isSubmitting}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  text-sm
                  font-medium
                  text-zinc-400
                  transition
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {showPassword ? "Masquer" : "Voir"}
              </button>
            </div>
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
              transition
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
