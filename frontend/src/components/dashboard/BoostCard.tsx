"use client";

import { useEffect, useState } from "react";

import { boostService, type BoostStatus } from "@/services/boost.service";

interface BoostCardProps {
  boost: BoostStatus;
  onUpdated(boost: BoostStatus): void;
}

export default function BoostCard({ boost, onUpdated }: BoostCardProps) {
  const [remaining, setRemaining] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshingAfterExpiry, setRefreshingAfterExpiry] = useState(false);

  useEffect(() => {
    if (!boost.isBoostActive || !boost.boostActiveUntil) {
      setRemaining("");
      setRefreshingAfterExpiry(false);
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;
    let isCancelled = false;

    const updateCountdown = async () => {
      const end = new Date(boost.boostActiveUntil!).getTime();
      const diff = end - Date.now();

      if (diff <= 0) {
        setRemaining("00:00:00");

        if (interval) {
          clearInterval(interval);
        }

        if (!refreshingAfterExpiry) {
          setRefreshingAfterExpiry(true);

          try {
            const status = await boostService.getStatus();

            if (!isCancelled) {
              onUpdated(status);
            }
          } finally {
            if (!isCancelled) {
              setRefreshingAfterExpiry(false);
            }
          }
        }

        return;
      }

      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1_000);

      setRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    void updateCountdown();

    interval = setInterval(() => {
      void updateCountdown();
    }, 1000);

    return () => {
      isCancelled = true;

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    boost.isBoostActive,
    boost.boostActiveUntil,
    onUpdated,
    refreshingAfterExpiry,
  ]);

  async function activateBoost() {
    setLoading(true);

    try {
      await boostService.activate();

      const status = await boostService.getStatus();

      onUpdated(status);
    } catch (error) {
      console.error("Erreur lors de lâ€™activation du Boost :", error);
    } finally {
      setLoading(false);
    }
  }

  const isActivationDisabled =
    loading || boost.isBoostActive || boost.boostCredits === 0;

  return (
    <article className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5 p-6">
      <p className="text-sm font-medium text-fuchsia-400">ðŸš€ Boost</p>

      <h2 className="mt-2 text-3xl font-bold">{boost.boostCredits}</h2>

      <p className="mt-2 text-sm text-zinc-400">CrÃ©dit(s) disponible(s)</p>

      {boost.isBoostActive ? (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="font-semibold text-emerald-300">ðŸš€ Boost actif</p>

          <p className="mt-2 text-sm text-zinc-400">Temps restant</p>

          <p className="mt-1 font-mono text-3xl font-bold text-white">
            {remaining || "Calcul..."}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm text-zinc-400">
            Votre annonce n&apos;est pas boostÃ©e actuellement.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={isActivationDisabled}
        onClick={activateBoost}
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Activation..."
          : boost.isBoostActive
            ? "Boost actif"
            : boost.boostCredits === 0
              ? "Aucun crÃ©dit disponible"
              : "Activer un Boost (1 heure)"}
      </button>
    </article>
  );
}

