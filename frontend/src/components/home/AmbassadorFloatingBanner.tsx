"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/providers/AuthProvider";
import { ambassadorService } from "@/services/ambassador.service";

const STORAGE_KEY = "ubiza-ambassador-banner-dismissed-at";
const HIDDEN_DURATION = 7 * 24 * 60 * 60 * 1000;
const DISPLAY_DELAY = 4000;

export default function AmbassadorFloatingBanner() {
  const { isAuthenticated, isAuthReady } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [isCheckingAmbassador, setIsCheckingAmbassador] = useState(true);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function prepareBanner() {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);

      if (dismissedAt) {
        const dismissedTime = Number(dismissedAt);
        const isStillHidden =
          Number.isFinite(dismissedTime) &&
          Date.now() - dismissedTime < HIDDEN_DURATION;

        if (isStillHidden) {
          setIsCheckingAmbassador(false);
          return;
        }

        localStorage.removeItem(STORAGE_KEY);
      }

      if (isAuthenticated) {
        try {
          const response = await ambassadorService.getMine();

          // Masquer uniquement lorsqu'un véritable dossier ambassadeur existe.
          if (response.ambassador?.id) {
            setIsCheckingAmbassador(false);
            return;
          }
        } catch {
          // Aucun dossier ambassadeur :
          // l'utilisateur connecté peut voir la bannière.
        }
      }

      if (cancelled) {
        return;
      }

      setIsCheckingAmbassador(false);

      timer = setTimeout(() => {
        if (!cancelled) {
          setIsVisible(true);
        }
      }, DISPLAY_DELAY);
    }

    void prepareBanner();

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isAuthenticated, isAuthReady]);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setIsVisible(false);
  }

  if (!isAuthReady || isCheckingAmbassador || !isVisible) {
    return null;
  }

  const destination = isAuthenticated
    ? "/dashboard/ambassador"
    : "/login?returnUrl=/dashboard/ambassador";

  return (
    <>
      <section className="relative z-40 px-4 pt-3 sm:px-6">
        <div className="ambassador-banner mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/30 bg-gradient-to-r from-fuchsia-950/90 via-purple-950/90 to-slate-950/95 px-5 py-4 shadow-[0_0_35px_rgba(217,70,239,0.16)] backdrop-blur-xl sm:px-7">
            <div className="ambassador-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer la bannière du programme ambassadeur"
              className="absolute right-3 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>

            <div className="relative flex flex-col gap-4 pr-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-bold text-fuchsia-300">
                  ✨ Programme Ambassadeur
                </p>

                <p className="text-base font-extrabold text-white sm:text-lg">
                  💸 Gagnez jusqu&apos;à 25 000 FCFA/mois
                </p>

                <p className="mt-1 text-sm text-white/70">
                  en recommandant Ubiza.
                </p>
              </div>

              <Link
                href={destination}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-black transition duration-300 hover:scale-[1.02] hover:bg-fuchsia-100 sm:w-auto"
              >
                Devenir ambassadeur →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .ambassador-banner {
          animation:
            ambassador-entry 0.65s ease-out both,
            ambassador-float 3.5s ease-in-out 0.65s infinite;
        }

        .ambassador-shine {
          animation: ambassador-shine 5s ease-in-out 1.2s infinite;
        }

        @keyframes ambassador-entry {
          from {
            opacity: 0;
            transform: translateY(-18px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes ambassador-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes ambassador-shine {
          0%,
          65% {
            transform: translateX(0);
            opacity: 0;
          }

          75% {
            opacity: 1;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ambassador-banner,
          .ambassador-shine {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
