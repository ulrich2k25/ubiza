"use client";

import { useEffect, useState } from "react";
import ManualPaymentForm from "@/components/payments/ManualPaymentForm";
import { useSearchParams } from "next/navigation";
import { boostService, type BoostStatus } from "@/services/boost.service";
import {
  paymentsService,
  type Payment,
  type PricingResponse,
} from "@/services/payments.service";

interface BoostCardProps {
  boost: BoostStatus;
  onUpdated(boost: BoostStatus): void;
}

export default function BoostCard({ boost, onUpdated }: BoostCardProps) {
  const [remaining, setRemaining] = useState("");

  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [showPurchase, setShowPurchase] = useState(false);
  const searchParams = useSearchParams();

  const [loadingPricing, setLoadingPricing] = useState(true);
  const [activatingCredit, setActivatingCredit] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
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
    if (
      !payment ||
      payment.provider === "MANUAL" ||
      payment.status === "SUCCESS" ||
      payment.status === "FAILED" ||
      payment.status === "CANCELLED" ||
      payment.status === "EXPIRED"
    ) {
      return;
    }

    let cancelled = false;

    const intervalId = window.setInterval(async () => {
      try {
        const refreshedPayment = await paymentsService.getOne(payment.id);

        if (cancelled) {
          return;
        }

        setPayment(refreshedPayment);

        if (refreshedPayment.status === "SUCCESS") {
          window.clearInterval(intervalId);

          const status = await boostService.getStatus();

          if (!cancelled) {
            onUpdated(status);
            setShowPurchase(false);

            setSuccess(
              "Paiement confirmé. Votre annonce est maintenant boostée.",
            );
            setError("");
          }
        }

        if (refreshedPayment.status === "FAILED") {
          window.clearInterval(intervalId);

          setError(
            refreshedPayment.failureReason ||
              "Le paiement Mobile Money a échoué.",
          );

          setSuccess("");
        }

        if (refreshedPayment.status === "CANCELLED") {
          window.clearInterval(intervalId);

          setError("Le paiement a été annulé.");

          setSuccess("");
        }

        if (refreshedPayment.status === "EXPIRED") {
          window.clearInterval(intervalId);

          setError("La demande de paiement a expiré.");

          setSuccess("");
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [payment?.id]);

  useEffect(() => {
    const shouldOpen = searchParams.get("openBoost") === "1";

    if (!shouldOpen) {
      return;
    }

    setShowPurchase(true);

    const timer = window.setTimeout(() => {
      document.getElementById("boost")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

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

  const isBusy = activatingCredit;
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

              {!payment && (
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => {
                    setShowPurchase(false);

                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm font-medium text-zinc-400 transition hover:text-white disabled:opacity-50"
                >
                  Fermer
                </button>
              )}
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

            {!payment && boostOffer && (
              <ManualPaymentForm
                purpose="BOOST"
                boostDuration="MINUTES_60"
                amount={boostOffer.amount}
                disabled={activatingCredit}
                onSubmitted={(submittedPayment, message) => {
                  setPayment(submittedPayment);
                  setSuccess(
                    message ||
                      "Votre paiement a été envoyé pour vérification. Votre Boost sera activé au plus tard sous 24 heures.",
                  );
                  setError("");
                }}
              />
            )}
            {payment && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">Montant à payer</p>

                    <p className="mt-1 text-xl font-bold text-white">
                      {formatAmount(Number(payment.amount))} FCFA
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                      payment.status,
                    )}`}
                  >
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Référence du paiement</p>

                    <p className="mt-1 break-all font-medium text-zinc-200">
                      {payment.externalReference}
                    </p>
                  </div>

                  {payment.customerPhone && (
                    <div>
                      <p className="text-zinc-500">Numéro Mobile Money</p>

                      <p className="mt-1 font-medium text-zinc-200">
                        {payment.customerPhone}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {payment.provider === "MANUAL"
                    ? "Vos informations de transaction ont été transmises. Après vérification, votre Boost sera activé au plus tard sous 24 heures."
                    : "Confirmez la demande Mobile Money sur votre téléphone. Cette page vérifiera automatiquement le paiement et activera votre Boost."}
                </p>

                {(payment.status === "PENDING" ||
                  payment.status === "PROCESSING") && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
                    {payment.provider === "CAMPAY" && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300/30 border-t-amber-300" />
                    )}

                    <p className="text-sm text-amber-200">
                      {payment.provider === "MANUAL"
                        ? "Paiement en attente de vérification par Ubiza."
                        : "En attente de la confirmation Mobile Money…"}
                    </p>
                  </div>
                )}

                {(payment.status === "FAILED" ||
                  payment.status === "CANCELLED" ||
                  payment.status === "EXPIRED") && (
                  <button
                    type="button"
                    disabled={processingPayment}
                    onClick={() => {
                      setPayment(null);
                      setError("");
                      setSuccess("");
                    }}
                    className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Réessayer avec un autre paiement
                  </button>
                )}
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

function getPaymentStatusLabel(status: Payment["status"]) {
  const labels: Record<Payment["status"], string> = {
    PENDING: "En attente",
    PROCESSING: "En cours",
    SUCCESS: "Payé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
  };

  return labels[status];
}

function getPaymentStatusClasses(status: Payment["status"]) {
  if (status === "SUCCESS") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
