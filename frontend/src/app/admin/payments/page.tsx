"use client";

import { useCallback, useEffect, useState } from "react";

import {
  paymentsService,
  type AdminManualPayment,
  type PaymentStatus,
} from "@/services/payments.service";

type PaymentFilter = "ALL" | PaymentStatus;

const filters: Array<{
  value: PaymentFilter;
  label: string;
}> = [
  { value: "PENDING", label: "En attente" },
  { value: "SUCCESS", label: "Validés" },
  { value: "FAILED", label: "Refusés" },
  { value: "ALL", label: "Tous" },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminManualPayment[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("PENDING");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await paymentsService.getManualPaymentsForAdmin(
        filter === "ALL" ? undefined : filter,
      );

      setPayments(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les paiements manuels.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  async function approvePayment(payment: AdminManualPayment) {
    const confirmed = window.confirm(
      `Confirmer la réception de ${formatAmount(
        Number(payment.amount),
      )} FCFA pour ${payment.user.email} ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(payment.id);
      setError("");
      setSuccess("");

      await paymentsService.approveManualPayment(payment.id);

      setSuccess("Paiement validé. Le forfait de l’utilisateur a été activé.");

      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de valider ce paiement.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectPayment(payment: AdminManualPayment) {
    const reason = window.prompt(
      "Indique la raison du refus :",
      "Transaction introuvable ou informations incorrectes.",
    );

    if (reason === null) {
      return;
    }

    if (reason.trim().length < 3) {
      setError("La raison du refus doit contenir au moins 3 caractères.");
      return;
    }

    try {
      setProcessingId(payment.id);
      setError("");
      setSuccess("");

      await paymentsService.rejectManualPayment(payment.id, reason.trim());

      setSuccess("Le paiement a été refusé.");

      await loadPayments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de refuser ce paiement.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">Paiements manuels</h1>

        <p className="mt-3 text-zinc-400">
          Vérifiez les transactions Mobile Money avant d’activer les forfaits.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setError("");
              setSuccess("");
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              filter === item.value
                ? "border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200"
                : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}

        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPayments()}
          className="ml-auto rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          Actualiser
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-200">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-zinc-400">Chargement des paiements manuels...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-zinc-400">
            Aucun paiement manuel dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {payments.map((payment) => {
            const manualData = payment.providerData?.manualPayment;
            const isPending =
              payment.status === "PENDING" || payment.status === "PROCESSING";
            const isProcessing = processingId === payment.id;

            return (
              <article
                key={payment.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">
                      {payment.user.email}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-white">
                      {getPurchaseLabel(payment)}
                    </h2>

                    <p className="mt-2 text-2xl font-black text-fuchsia-300">
                      {formatAmount(Number(payment.amount))}{" "}
                      {payment.currency.code}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      payment.status,
                    )}`}
                  >
                    {getStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PaymentDetail
                    label="Opérateur"
                    value={manualData?.operator || "Non renseigné"}
                  />

                  <PaymentDetail
                    label="Numéro payeur"
                    value={
                      manualData?.payerPhone ||
                      payment.customerPhone ||
                      "Non renseigné"
                    }
                  />

                  <PaymentDetail
                    label="Référence transaction"
                    value={
                      manualData?.transactionReference ||
                      payment.providerTransactionId ||
                      "Non renseignée"
                    }
                  />

                  <PaymentDetail
                    label="Date d’envoi"
                    value={formatDate(
                      manualData?.submittedAt || payment.createdAt,
                    )}
                  />

                  <PaymentDetail
                    label="Référence Ubiza"
                    value={payment.externalReference || "Non disponible"}
                  />

                  <PaymentDetail
                    label="Identifiant paiement"
                    value={payment.id}
                  />
                </div>

                {payment.failureReason && (
                  <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                      Raison du refus
                    </p>

                    <p className="mt-2 text-sm text-red-100">
                      {payment.failureReason}
                    </p>
                  </div>
                )}

                {isPending && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => void approvePayment(payment)}
                      className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isProcessing ? "Traitement..." : "Valider le paiement"}
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => void rejectPayment(payment)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Refuser le paiement
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function PaymentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-medium text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function getPurchaseLabel(payment: AdminManualPayment) {
  if (payment.purpose === "BOOST") {
    const duration = payment.providerData?.boostDurationMinutes;

    return typeof duration === "number"
      ? `Boost de ${duration} minutes`
      : "Boost d’annonce";
  }

  const plan = payment.providerData?.premiumPlan;

  if (plan === "DAY_1") {
    return "Premium — 1 jour";
  }

  if (plan === "DAYS_7") {
    return "Premium — 7 jours";
  }

  if (plan === "DAYS_30") {
    return "Premium — 30 jours";
  }

  return "Abonnement Premium";
}

function getStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    PENDING: "En attente",
    PROCESSING: "En cours",
    SUCCESS: "Validé",
    FAILED: "Refusé",
    CANCELLED: "Annulé",
    EXPIRED: "Expiré",
  };

  return labels[status];
}

function getStatusClasses(status: PaymentStatus) {
  if (status === "SUCCESS") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "FAILED" || status === "CANCELLED") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (status === "EXPIRED") {
    return "border-zinc-400/20 bg-zinc-400/10 text-zinc-300";
  }

  return "border-amber-400/20 bg-amber-400/10 text-amber-300";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
