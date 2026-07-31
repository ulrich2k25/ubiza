"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SESSION_KEY = "ubiza-age-confirmed";

export default function AgeGate() {
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const alreadyConfirmed = sessionStorage.getItem(SESSION_KEY) === "true";

    setIsVisible(!alreadyConfirmed);
    setIsReady(true);
  }, []);

  function handleEnter() {
    if (!isConfirmed) {
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "true");
    setIsVisible(false);
  }

  function handleLeave() {
    window.location.href = "https://www.google.com";
  }

  if (!isReady || !isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-violet-600/15 blur-[100px]" />
      </div>

      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/95 shadow-[0_30px_100px_rgba(0,0,0,0.75)]">
        <div className="h-1.5 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 text-3xl">
              🔞
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400">
                Vérification d’âge
              </p>

              <h1
                id="age-gate-title"
                className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl"
              >
                Accès réservé aux adultes
              </h1>
            </div>
          </div>

          <p className="mt-6 text-base font-semibold leading-7 text-white">
            Ubiza est strictement réservé aux personnes âgées de 18 ans ou plus.
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            En continuant, vous confirmez être majeur et accepter les règles
            d’utilisation de la plateforme.
          </p>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-500/[0.05]">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-fuchsia-500"
            />

            <span className="text-sm font-semibold leading-6 text-white">
              Je confirme avoir 18 ans ou plus.
            </span>
          </label>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs leading-5 text-zinc-500">
              Les annonces sont publiées par les utilisateurs, qui restent
              responsables de leur contenu et de leurs échanges. Ubiza
              n’intervient pas dans les transactions entre utilisateurs.
            </p>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            En entrant, vous acceptez également nos{" "}
            <Link
              href="/informations/conditions"
              className="font-semibold text-fuchsia-300 hover:text-fuchsia-200"
            >
              Conditions d’utilisation
            </Link>{" "}
            et notre{" "}
            <Link
              href="/informations/confidentialite"
              className="font-semibold text-fuchsia-300 hover:text-fuchsia-200"
            >
              Politique de confidentialité
            </Link>
            .
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleLeave}
              className="order-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white sm:order-1"
            >
              Quitter le site
            </button>

            <button
              type="button"
              disabled={!isConfirmed}
              onClick={handleEnter}
              className="order-1 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_12px_35px_rgba(217,70,239,0.22)] transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none sm:order-2"
            >
              Entrer sur Ubiza
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
