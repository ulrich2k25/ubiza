"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { boostService, type BoostStatus } from "@/services/boost.service";
import {
  paymentsService,
  type PricingResponse,
  type CheckoutProvider,
} from "@/services/payments.service";

interface BoostCardProps {
  boost: BoostStatus;
  onUpdated(boost: BoostStatus): void;
}

export default function BoostCard({ boost, onUpdated }: BoostCardProps) {
  const [remaining, setRemaining] = useState("");

  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CheckoutProvider>("SASPAY");
  const searchParams = useSearchParams();

  const [loadingPricing, setLoadingPricing] = useState(true);
  const [activatingCredit, setActivatingCredit] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [refreshingAfterExpiry, setRefreshingAfterExpiry] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const boostOffer = pricing?.boost.find(
    (offer) => offer.duration === "MINUTES_60",
  );

  useEffect(() => {
    paymentsService
      .getPricing()
      .then(setPricing)
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoadingPricing(false);
      });
  }, []);

  useEffect(() => {
    const shouldOpen = searchParams.get("openBoost") === "1";

    if (!shouldOpen) {
      return;
    }

    const openTimer = window.setTimeout(() => {
      setShowPurchase(true);
    }, 0);

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("boost")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [searchParams]);

  useEffect(() => {
    if (!boost.isBoostActive || !boost.boostActiveUntil) {
      const timer = window.setTimeout(() => {
        setRemaining("");
        setRefreshingAfterExpiry(false);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    let isCancelled = false;

    const updateCountdown = async () => {
      const end = new Date(boost.boostActiveUntil!).getTime();
      const difference = end - Date.now();

      if (difference <= 0) {
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
          } catch (err) {
            console.error("Erreur lors du rafraîchissement du Boost :", err);
          } finally {
            if (!isCancelled) {
              setRefreshingAfterExpiry(false);
            }
          }
        }

        return;
      }

      const hours = Math.floor(difference / 3_600_000);
      const minutes = Math.floor((difference % 3_600_000) / 60_000);
      const seconds = Math.floor((difference % 60_000) / 1_000);

      setRemaining(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    void updateCountdown();

    const interval = window.setInterval(() => {
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

  async function activateCreditBoost() {
    try {
      setActivatingCredit(true);
      setError("");
      setSuccess("");

      await boostService.activate();

      const status = await boostService.getStatus();

      onUpdated(status);
      setSuccess("Votre Boost gratuit est maintenant actif.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d’activer le Boost.",
      );
    } finally {
      setActivatingCredit(false);
    }
  }
  async function startPaidBoost() {
    if (!boostOffer) {
      setError("Le tarif du Boost est indisponible.");
      return;
    }

    try {
      setStartingPayment(true);
      setError("");
      setSuccess("");

      const response = await paymentsService.createBoost("MINUTES_60", undefined, selectedProvider);

      const checkoutUrl = response.checkoutUrl?.trim();

      if (!checkoutUrl) {
        throw new Error("Impossible d'obtenir la page de paiement sécurisée.");
      }

      window.localStorage.setItem(
        "ubiza_pending_payment_id",
        response.payment.id,
      );

      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'initialiser le paiement.",
      );
    } finally {
      setStartingPayment(false);
    }
  }

  const isBusy = activatingCredit || startingPayment;
  return (
    <article
      id="boost"
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fuchsia-400">
              🚀 Mise en avant
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">Boost</h2>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              boost.isBoostActive
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-zinc-400"
            }`}
          >
            {boost.isBoostActive ? "Actif" : "Inactif"}
          </span>
        </div>

        <p className="mt-4 max-w-md text-sm leading-6 text-zinc-400">
          Placez temporairement votre annonce devant davantage de visiteurs et
          augmentez vos chances d’être contacté.
        </p>

        {boost.isBoostActive ? (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-xl">
                🚀
              </span>

              <div>
                <p className="font-semibold text-emerald-300">
                  Votre annonce est boostée
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  Elle bénéficie actuellement d’une visibilité renforcée.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-zinc-400">Temps restant</p>

              <p className="mt-2 font-mono text-3xl font-bold tracking-wide text-white">
                {remaining || "Calcul..."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-400">Crédits disponibles</p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {boost.boostCredits}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-zinc-400">Durée d’un Boost</p>

                <p className="mt-2 text-2xl font-bold text-fuchsia-300">
                  1 heure
                </p>
              </div>
            </div>

            {boost.boostCredits > 0 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={activateCreditBoost}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activatingCredit ? "Activation..." : "Utiliser 1 crédit Boost"}
              </button>
            )}

            {!showPurchase && (
              <button
                type="button"
                disabled={isBusy || loadingPricing}
                onClick={() => {
                  setShowPurchase(true);
                  setError("");
                  setSuccess("");
                }}
                className={`w-full rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  boost.boostCredits > 0
                    ? "mt-3 border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
                    : "mt-5 bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white hover:opacity-90"
                }`}
              >
                {loadingPricing
                  ? "Chargement du tarif..."
                  : boostOffer
                    ? `Acheter un Boost — ${formatAmount(
                        boostOffer.amount,
                      )} FCFA`
                    : "Acheter un Boost"}
              </button>
            )}
          </>
        )}

        {!boost.isBoostActive && showPurchase && (
          <div className="mt-6 rounded-2xl border border-fuchsia-400/20 bg-black/25 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">Acheter un Boost</p>

                <p className="mt-1 text-sm text-zinc-400">
                  Votre annonce sera mise en avant pendant 1 heure.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPurchase(false);

                  setError("");
                  setSuccess("");
                }}
                className="text-sm font-medium text-zinc-400 transition hover:text-white disabled:opacity-50"
              >
                Fermer
              </button>
            </div>

            {boostOffer && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Boost 1 heure
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Mise en avant immédiate après confirmation
                  </p>
                </div>

                <p className="text-xl font-bold text-fuchsia-300">
                  {formatAmount(boostOffer.amount)} FCFA
                </p>
              </div>
            )}

            {boostOffer && (
              <div className="mt-5">
                <fieldset className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4">
                <legend className="px-2 text-sm font-semibold text-white">Moyen de paiement</legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(["FAPSHI", "SASPAY"] as const).map((option) => (
                    <label key={option} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${selectedProvider === option ? "border-fuchsia-400 bg-fuchsia-500/15 text-white" : "border-white/10 bg-white/5 text-zinc-300"}`}>
                      <input type="radio" name="boost-payment-provider" value={option} checked={selectedProvider === option} disabled={startingPayment} onChange={() => setSelectedProvider(option)} className="accent-fuchsia-500" />
                      {option === "FAPSHI" ? "Fapshi" : "SasPay"}
                    </label>
                  ))}
                </div>
              </fieldset>
  <button
    type="button"
    disabled={isBusy}
    onClick={startPaidBoost}
                  className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startingPayment
                    ? "Redirection vers le paiement..."
                    : `Payer ${formatAmount(boostOffer.amount)} FCFA`}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                  Vous serez redirigé vers la page de paiement sécurisée.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-200">{success}</p>
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-white/10 bg-black/10 px-6 py-4">
        <p className="text-xs leading-5 text-zinc-500">
          Un Boost ne peut pas être acheté lorsqu’un autre Boost est encore
          actif.
        </p>
      </div>
    </article>
  );
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
