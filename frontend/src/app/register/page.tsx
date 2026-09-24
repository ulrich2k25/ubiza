"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/features/auth/auth.service";
import { useAuth } from "@/providers/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [referralCode, setReferralCode] = useState("");
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralFromUrl, setReferralFromUrl] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCodeFromUrl = params.get("ref");

    if (!referralCodeFromUrl) {
      return;
    }

    const normalizedReferralCode = referralCodeFromUrl.trim().toUpperCase();

    if (!normalizedReferralCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      setReferralCode(normalizedReferralCode);
      setReferralFromUrl(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);

    const next = params.get("next") ?? params.get("returnUrl");

    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }

    return "/";
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setLoading(true);

      const normalizedUsername = username.trim();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedReferralCode = referralCode.trim().toUpperCase();

      await authService.register({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        ...(normalizedReferralCode
          ? { referralCode: normalizedReferralCode }
          : {}),
      });

      await authService.login({
        identifier: normalizedEmail,
        password,
      });

      await refreshAuth();

      router.replace(getSafeNextPath());
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer votre compte.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLoginRedirect() {
    const next = getSafeNextPath();

    router.push(`/login?returnUrl=${encodeURIComponent(next)}`);
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
        py-10
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
        onSubmit={handleRegister}
        className="
          relative
          w-full
          max-w-md
          space-y-5
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

          <h2 className="mt-5 text-2xl font-bold">Créer ton compte 🚀</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Ça prend moins de 30 secondes.
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

        <div>
          <label
            htmlFor="username"
            className="mb-2 block text-sm text-zinc-300"
          >
            Pseudo
          </label>

          <input
            id="username"
            type="text"
            placeholder="ex. alex237"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
            autoComplete="username"
            className="input-style"
            required
          />
        </div>

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
            disabled={loading}
            autoComplete="email"
            className="input-style"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm text-zinc-300"
          >
            Mot de passe
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
              className="
                input-style
                pr-20
              "
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={loading}
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
                disabled:opacity-50
              "
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? "Masquer" : "Voir"}
            </button>
          </div>

          <p className="mt-2 text-xs text-zinc-500">Minimum 8 caractères.</p>
        </div>

        <div>
          {referralFromUrl && referralCode ? (
            <div
              className="
                rounded-2xl
                border
                border-fuchsia-500/20
                bg-fuchsia-500/10
                px-4
                py-3
              "
            >
              <p className="text-sm text-fuchsia-200">
                Code de parrainage appliqué
              </p>

              <p className="mt-1 font-semibold text-white">{referralCode}</p>
            </div>
          ) : showReferralInput ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Code de parrainage"
                value={referralCode}
                onChange={(event) =>
                  setReferralCode(event.target.value.toUpperCase())
                }
                disabled={loading}
                autoComplete="off"
                className="input-style"
              />

              <button
                type="button"
                onClick={() => {
                  setReferralCode("");
                  setShowReferralInput(false);
                }}
                disabled={loading}
                className="
                  text-sm
                  text-zinc-400
                  transition
                  hover:text-white
                "
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReferralInput(true)}
              disabled={loading}
              className="
                text-sm
                font-medium
                text-fuchsia-400
                transition
                hover:text-fuchsia-300
              "
            >
              Tu as un code de parrainage ?
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
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
            disabled:opacity-50
          "
        >
          {loading ? "Création du compte..." : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-zinc-400">
          Déjà un compte ?
          <button
            type="button"
            onClick={handleLoginRedirect}
            disabled={loading}
            className="
              ml-2
              font-semibold
              text-fuchsia-400
              transition
              hover:text-fuchsia-300
              disabled:opacity-50
            "
          >
            Se connecter
          </button>
        </p>
      </form>
    </main>
  );
}
