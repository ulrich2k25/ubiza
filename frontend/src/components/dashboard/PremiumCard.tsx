"use client";

import { useEffect, useState } from "react";

import ManualPaymentForm from "@/components/payments/ManualPaymentForm";
import { api } from "@/services/api";
import {
  paymentsService,
  type Payment,
  type PremiumPlan,
  type PricingResponse,
} from "@/services/payments.service";

interface PremiumStatus {
  isPremium: boolean;
  isTrial: boolean;
  daysRemaining: number;
  premiumTrialUsed: boolean;
  premiumTrialStartedAt: string | null;
  premiumActiveUntil: string | null;
  trialDurationDays: number;
}

export default function PremiumCard() {
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan>("DAYS_7");

  const [showPurchase, setShowPurchase] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  const [loading, setLoading] = useState(true);
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPremium() {
    const response = await api("/premium/me");

    setPremium(response as PremiumStatus);
  }

  async function loadPricing() {
    const response = await paymentsService.getPricing();

    setPricing(response);
  }
  async function startFreeTrial() {
    try {
      setIsStartingTrial(true);
      setError("");
      setSuccess("");

      const response = await api("/premium/trial", {
        method: "POST",
      });

      setPremium(response as PremiumStatus);
      setSuccess(
        "Votre essai Premium gratuit de 3 jours est maintenant actif.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’activer votre essai Premium gratuit.",
      );
    } finally {
      setIsStartingTrial(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Promise.all([loadPremium(), loadPricing()])
        .catch((err: Error) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const paymentId = payment?.id;
  const paymentProvider = payment?.provider;
  const paymentStatus = payment?.status;

  /*
   * Le polling automatique reste réservé aux paiements CamPay.
   * Un paiement manuel attend l'approbation de l'administrateur.
   */
  useEffect(() => {
    if (
      !paymentId ||
      paymentProvider === "MANUAL" ||
      paymentStatus === "SUCCESS" ||
      paymentStatus === "FAILED" ||
      paymentStatus === "CANCELLED" ||
      paymentStatus === "EXPIRED"
    ) {
      return;
    }

    let cancelled = false;

    const intervalId = window.setInterval(async () => {
      try {
        const refreshedPayment = await paymentsService.getOne(paymentId);

        if (cancelled) {
          return;
        }

        setPayment(refreshedPayment);

        if (refreshedPayment.status === "SUCCESS") {
          window.clearInterval(intervalId);

          await loadPremium();

          if (!cancelled) {
            setSuccess(
              "Paiement confirmé. Votre abonnement Premium est actif.",
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
        console.error("Impossible de vérifier le paiement :", err);
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [paymentId, paymentProvider, paymentStatus]);

  const expirationDate = premium?.premiumActiveUntil
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(premium.premiumActiveUntil))
    : null;

  const selectedOffer = pricing?.premium.find(
    (offer) => offer.plan === selectedPlan,
  );

  if (loading) {
    return (
      <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
        <p className="text-sm text-zinc-400">Chargement du statut Premium...</p>
      </article>
    );
  }

  if (!premium || !pricing) {
    return (
      <article className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-sm text-red-200">
          {error || "Impossible de charger les informations Premium."}
        </p>
      </article>
    );
  }

  return (
    <article className="flex flex-col rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-fuchsia-400">Abonnement</p>

          <h3 className="mt-2 text-2xl font-bold text-white">Premium</h3>
        </div>

        <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
          {premium.isPremium ? "Actif" : "Standard"}
        </span>
      </div>

      {premium.isPremium ? (
        <div className="mt-6">
          <p className="text-lg font-semibold text-white">
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
            <Benefit label="Visibilité renforcée sur Ubiza" />
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
              <p className="mt-1 font-semibold text-white">
                Actif jusqu’au {expirationDate}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-lg font-semibold text-white">
            Augmentez la visibilité de votre profil
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Passez Premium pour apparaître en priorité et recevoir des Boosts.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <Benefit label="Priorité dans les résultats" />
            <Benefit label="Statut Premium visible" />
            <Benefit label="Visibilité renforcée sur Ubiza" />
          </div>

          {!premium.premiumTrialUsed ? (
            <div className="mt-6 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
              <p className="font-semibold text-white">
                Essayez Premium gratuitement pendant {premium.trialDurationDays}{" "}
                jours
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Activez votre essai quand vous êtes prêt à profiter d’une
                meilleure visibilité. L’essai ne peut être utilisé qu’une seule
                fois.
              </p>

              <button
                type="button"
                onClick={startFreeTrial}
                disabled={isStartingTrial}
                className="mt-4 w-full rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingTrial
                  ? "Activation en cours..."
                  : `Activer mon essai gratuit de ${premium.trialDurationDays} jours`}
              </button>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
              Votre essai Premium gratuit a déjà été utilisé. Vous pouvez
              choisir un forfait pour réactiver Premium.
            </p>
          )}
        </div>
      )}

      <div className="mt-7 border-t border-white/10 pt-6">
        {!showPurchase ? (
          <button
            type="button"
            onClick={() => {
              setShowPurchase(true);
              setPayment(null);
              setError("");
              setSuccess("");
            }}
            className="w-full rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-3 font-semibold text-fuchsia-200 transition hover:bg-fuchsia-500/20"
          >
            {premium.isPremium
              ? "Prolonger mon abonnement"
              : "Choisir un forfait Premium"}
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-white">
                {premium.isPremium
                  ? "Choisir une durée de prolongation"
                  : "Choisir un forfait"}
              </p>

              {!payment && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchase(false);
                    setPayment(null);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  Fermer
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {pricing.premium.map((offer) => {
                const selected = selectedPlan === offer.plan;

                return (
                  <button
                    key={offer.plan}
                    type="button"
                    disabled={Boolean(payment)}
                    onClick={() => {
                      setSelectedPlan(offer.plan);
                      setError("");
                      setSuccess("");
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-fuchsia-400 bg-fuchsia-500/15"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="block text-sm font-semibold text-white">
                      {getPremiumPlanLabel(offer.plan)}
                    </span>

                    <span className="mt-2 block text-lg font-bold text-fuchsia-300">
                      {formatAmount(offer.amount)} FCFA
                    </span>
                  </button>
                );
              })}
            </div>

            {!payment && selectedOffer && (
              <ManualPaymentForm
                purpose="PREMIUM"
                premiumPlan={selectedPlan}
                amount={selectedOffer.amount}
                onSubmitted={(submittedPayment, message) => {
                  setPayment(submittedPayment);
                  setSuccess(
                    message ||
                      "Votre paiement a été envoyé pour vérification. Votre forfait sera activé au plus tard sous 24 heures.",
                  );
                  setError("");
                }}
              />
            )}

            {payment && (
              <div className="mt-5 rounded-xl border border-fuchsia-400/20 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">
                      {payment.provider === "MANUAL"
                        ? "Paiement transmis"
                        : "Paiement à effectuer"}
                    </p>

                    <p className="mt-1 text-xl font-bold text-white">
                      {formatAmount(Number(payment.amount))} FCFA
                    </p>
                  </div>

                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Référence Ubiza</p>

                    <p className="mt-1 break-all font-medium text-zinc-200">
                      {payment.externalReference || "Non disponible"}
                    </p>
                  </div>

                  {payment.customerPhone && (
                    <div>
                      <p className="text-zinc-500">
                        Numéro ayant effectué le paiement
                      </p>

                      <p className="mt-1 font-medium text-zinc-200">
                        {payment.customerPhone}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {payment.provider === "MANUAL"
                    ? "Vos informations de transaction ont été transmises. Après vérification, votre abonnement sera activé au plus tard sous 24 heures."
                    : "Confirmez la demande Mobile Money sur votre téléphone. Cette page vérifiera automatiquement le paiement et activera votre abonnement."}
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
                    onClick={() => {
                      setPayment(null);
                      setSuccess("");
                      setError("");
                    }}
                    className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
                  >
                    Réessayer avec un autre paiement
                  </button>
                )}
              </div>
            )}
          </>
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

function getPremiumPlanLabel(plan: PremiumPlan) {
  const labels: Record<PremiumPlan, string> = {
    DAY_1: "1 jour",
    DAYS_7: "7 jours",
    DAYS_30: "30 jours",
  };

  return labels[plan];
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
