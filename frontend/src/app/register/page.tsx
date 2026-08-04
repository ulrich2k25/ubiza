"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/features/auth/auth.service";
import { useAuth } from "@/providers/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCodeFromUrl = params.get("ref");

    if (!referralCodeFromUrl) {
      return;
    }

    const timer = window.setTimeout(() => {
      setReferralCode(referralCodeFromUrl.trim().toUpperCase());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

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

      const normalizedReferralCode = referralCode.trim().toUpperCase();

      await authService.register({
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        ...(normalizedReferralCode
          ? { referralCode: normalizedReferralCode }
          : {}),
      });

      await authService.login({
        email: email.trim(),
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
          <h1 className="text-4xl font-black">
            <span className="text-white">Ubi</span>
            <span className="text-fuchsia-500">za</span>
          </h1>

          <h2 className="mt-5 text-2xl font-bold">Créer ton compte 🚀</h2>

          <p className="mt-2 text-sm text-zinc-400">
            Rejoins Ubiza et finalise ton expérience.
          </p>
        </div>

        {error ? (
          <div
            className="
              rounded-xl
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

        <input
          type="text"
          placeholder="Pseudo Ubiza"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="input-style"
          autoComplete="username"
          required
        />

        <input
          type="text"
          placeholder="Prénom"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="input-style"
          autoComplete="given-name"
          required
        />

        <input
          type="text"
          placeholder="Nom"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="input-style"
          autoComplete="family-name"
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input-style"
          autoComplete="email"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-style"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <div>
          <input
            type="text"
            placeholder="Code de parrainage (facultatif)"
            value={referralCode}
            onChange={(event) =>
              setReferralCode(event.target.value.toUpperCase())
            }
            className="input-style"
            autoComplete="off"
          />

          {referralCode ? (
            <p className="mt-2 text-xs text-fuchsia-300">
              Code de parrainage détecté : {referralCode}
            </p>
          ) : null}
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
            transition
            hover:bg-fuchsia-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? "Création du compte..." : "Créer mon compte"}
        </button>

        <p className="text-center text-sm text-zinc-400">
          Déjà inscrit ?
          <button
            type="button"
            onClick={() => {
              const next = getSafeNextPath();
              router.push(`/login?next=${encodeURIComponent(next)}`);
            }}
            className="
              ml-2
              font-semibold
              text-fuchsia-400
              transition
              hover:text-fuchsia-300
            "
          >
            Se connecter
          </button>
        </p>
      </form>
    </main>
  );
}

