"use client";

import { useState } from "react";

import {
  paymentsService,
  type BoostDuration,
  type ManualPaymentOperator,
  type Payment,
  type PremiumPlan,
} from "@/services/payments.service";

interface ManualPaymentFormProps {
  purpose: "PREMIUM" | "BOOST";
  premiumPlan?: PremiumPlan;
  boostDuration?: BoostDuration;
  amount: number;
  disabled?: boolean;
  onSubmitted: (payment: Payment, message: string) => void;
}

const paymentNumbers: Record<ManualPaymentOperator, string> = {
  MTN: process.env.NEXT_PUBLIC_MANUAL_PAYMENT_MTN_NUMBER ?? "",
  ORANGE: process.env.NEXT_PUBLIC_MANUAL_PAYMENT_ORANGE_NUMBER ?? "",
};

export default function ManualPaymentForm({
  purpose,
  premiumPlan,
  boostDuration,
  amount,
  disabled = false,
  onSubmitted,
}: ManualPaymentFormProps) {
  const [operator, setOperator] = useState<ManualPaymentOperator>("MTN");

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [payerPhone, setPayerPhone] = useState("");
  const [transactionReference, setTransactionReference] = useState("");

  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const paymentNumber = paymentNumbers[operator];

  async function copyPaymentNumber() {
    if (!paymentNumber) {
      setError(`Le numéro ${operator} de paiement n'est pas configuré.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentNumber);
      setCopied(true);
      setError("");

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Impossible de copier le numéro de paiement.");
    }
  }

  async function submitPayment() {
    try {
      setProcessing(true);
      setError("");

      let response;

      if (purpose === "PREMIUM") {
        if (!premiumPlan) {
          throw new Error("Le forfait Premium est absent.");
        }

        response = await paymentsService.createManualPremium(
          premiumPlan,
          operator,
          payerPhone.trim(),
          transactionReference.trim(),
        );
      } else {
        if (!boostDuration) {
          throw new Error("La durée du Boost est absente.");
        }

        response = await paymentsService.createManualBoost(
          boostDuration,
          operator,
          payerPhone.trim(),
          transactionReference.trim(),
        );
      }

      onSubmitted(response.payment, response.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'envoyer les informations du paiement.",
      );
    } finally {
      setProcessing(false);
    }
  }

  const canSubmit =
    payerPhone.trim().length >= 8 && transactionReference.trim().length >= 3;

  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-zinc-300">
        Choisissez votre moyen de paiement
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled || processing}
          onClick={() => {
            setOperator("MTN");
            setShowTransactionForm(false);
            setError("");
          }}
          className={`rounded-xl border p-4 text-left transition ${
            operator === "MTN"
              ? "border-yellow-400 bg-yellow-400/10"
              : "border-white/10 bg-black/20 hover:border-white/20"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="block font-semibold text-white">
            MTN Mobile Money
          </span>

          <span className="mt-1 block text-xs text-zinc-400">
            Payer avec MTN MoMo
          </span>
        </button>

        <button
          type="button"
          disabled={disabled || processing}
          onClick={() => {
            setOperator("ORANGE");
            setShowTransactionForm(false);
            setError("");
          }}
          className={`rounded-xl border p-4 text-left transition ${
            operator === "ORANGE"
              ? "border-orange-400 bg-orange-400/10"
              : "border-white/10 bg-black/20 hover:border-white/20"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span className="block font-semibold text-white">Orange Money</span>

          <span className="mt-1 block text-xs text-zinc-400">
            Payer avec Orange Money
          </span>
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
        <p className="text-sm text-zinc-400">Montant à envoyer</p>

        <p className="mt-1 text-2xl font-bold text-white">
          {formatAmount(amount)} FCFA
        </p>

        <div className="mt-4">
          <p className="text-sm text-zinc-500">
            Numéro {operator === "MTN" ? "MTN MoMo" : "Orange Money"}
          </p>

          {paymentNumber ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="break-all font-semibold text-white">
                {paymentNumber}
              </p>

              <button
                type="button"
                disabled={disabled || processing}
                onClick={copyPaymentNumber}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
              >
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-300">
              Numéro de paiement non configuré.
            </p>
          )}
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Envoyez exactement le montant indiqué au numéro ci-dessus, puis
          revenez sur cette page.
        </p>
      </div>

      {!showTransactionForm ? (
        <button
          type="button"
          disabled={disabled || processing || !paymentNumber}
          onClick={() => {
            setShowTransactionForm(true);
            setError("");
          }}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          J&apos;ai effectué le paiement
        </button>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="font-semibold text-white">
            Informations de la transaction
          </p>

          <div className="mt-4">
            <label
              htmlFor="manual-payment-phone"
              className="text-sm font-medium text-zinc-300"
            >
              Numéro ayant effectué le paiement
            </label>

            <input
              id="manual-payment-phone"
              type="tel"
              value={payerPhone}
              disabled={processing}
              onChange={(event) => setPayerPhone(event.target.value)}
              placeholder="+237 6XX XXX XXX"
              autoComplete="tel"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-400 disabled:opacity-50"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="manual-payment-reference"
              className="text-sm font-medium text-zinc-300"
            >
              Référence de la transaction
            </label>

            <input
              id="manual-payment-reference"
              type="text"
              value={transactionReference}
              disabled={processing}
              onChange={(event) => setTransactionReference(event.target.value)}
              placeholder="Exemple : MP260802123456"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-400 disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            disabled={processing || !canSubmit}
            onClick={submitPayment}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? "Envoi en cours..." : "Envoyer pour vérification"}
          </button>

          <button
            type="button"
            disabled={processing}
            onClick={() => {
              setShowTransactionForm(false);
              setError("");
            }}
            className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Retour
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}
