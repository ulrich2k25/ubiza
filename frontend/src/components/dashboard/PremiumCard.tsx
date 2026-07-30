"use client";

import { useEffect, useState } from "react";

import { api } from "@/services/api";

interface PremiumStatus {
  isPremium: boolean;
  isTrial: boolean;
  daysRemaining: number;
  premiumTrialUsed: boolean;
  premiumTrialStartedAt: string | null;
  premiumActiveUntil: string | null;
}

export default function PremiumCard() {
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/premium/me")
      .then((response) => {
        setPremium(response as PremiumStatus);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <p className="text-sm text-zinc-400">Chargement du statut Premium...</p>
      </article>
    );
  }

  if (error || !premium) {
    return (
      <article className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-sm text-red-200">
          {error || "Impossible de charger le statut Premium."}
        </p>
      </article>
    );
  }

  const expirationDate = premium.premiumActiveUntil
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(premium.premiumActiveUntil))
    : null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-fuchsia-400">Abonnement</p>

          <h3 className="mt-2 text-2xl font-bold">Premium</h3>
        </div>

        <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
          {premium.isPremium ? "Actif" : "Standard"}
        </span>
      </div>

      {premium.isPremium ? (
        <div className="mt-6">
          <p className="text-lg font-semibold">
            {premium.isTrial
              ? "Votre essai gratuit est actif"
              : "Votre abonnement Premium est actif"}
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Votre profil bénéficie d’une meilleure visibilité sur Ubiza.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <Benefit label="Priorité dans les résultats" />
            <Benefit label="Statut Premium visible" />
            <Benefit label="Boosts mensuels inclus" />
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm text-zinc-400">
              {premium.daysRemaining > 0
                ? `${premium.daysRemaining} jour${
                    premium.daysRemaining > 1 ? "s" : ""
                  } restant${premium.daysRemaining > 1 ? "s" : ""}`
                : "Expiration prochaine"}
            </p>

            {expirationDate && (
              <p className="mt-1 font-semibold">
                Actif jusqu’au {expirationDate}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-lg font-semibold">
            Augmentez la visibilité de votre profil
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Passez Premium pour apparaître en priorité et recevoir des Boosts.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <Benefit label="Priorité dans les résultats" />
            <Benefit label="Statut Premium visible" />
            <Benefit label="Boosts mensuels inclus" />
          </div>
        </div>
      )}

      <button type="button" disabled className="mt-auto pt-6">
        <span className="block w-full cursor-not-allowed rounded-xl bg-white/10 px-4 py-3 text-center font-semibold text-zinc-400">
          Gestion Premium bientôt disponible
        </span>
      </button>
    </article>
  );
}

function Benefit({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-xs font-bold text-fuchsia-300">
        ✓
      </span>

      <span className="text-zinc-300">{label}</span>
    </div>
  );
}
