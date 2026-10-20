"use client";

import { useCallback, useEffect, useState } from "react";

import {
  paymentsService,
  type AdminPayment,
  type PaymentProvider,
  type PaymentStatus,
} from "@/services/payments.service";

type PaymentFilter = "ALL" | PaymentStatus;

const filters: Array<{
  value: PaymentFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "PROCESSING", label: "En cours" },
  { value: "SUCCESS", label: "Réussis" },
  { value: "FAILED", label: "Échoués" },
  { value: "CANCELLED", label: "Annulés" },
  { value: "EXPIRED", label: "Expirés" },
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await paymentsService.getPaymentsForAdmin(
        filter === "ALL" ? undefined : filter,
      );

      setPayments(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l’historique des paiements.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPayments]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white">Paiements</h1>

      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setError("");
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

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-zinc-400">Chargement des paiements...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-zinc-400">
            Aucun paiement dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-zinc-500">
                      {payment.user.email}
                    </p>

                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                      {getProviderLabel(payment)}
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-bold text-white">
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
                  label="Provider"
                  value={getProviderLabel(payment)}
                />

                <PaymentDetail
                  label="Téléphone"
                  value={payment.customerPhone || "Non renseigné"}
                />

                <PaymentDetail
                  label="Référence Ubiza"
                  value={payment.externalReference || "Non disponible"}
                />

                <PaymentDetail
                  label="ID provider / Payment Platform"
                  value={
                    payment.providerTransactionId ||
                    payment.providerData?.paymentPlatform?.paymentId ||
                    "Non disponible"
                  }
                />

                <PaymentDetail
                  label="Référence provider"
                  value={
                    payment.providerData?.paymentPlatform?.providerReference ||
                    payment.providerData?.manualPayment?.transactionReference ||
                    "Non disponible"
                  }
                />

                <PaymentDetail
                  label="Identifiant paiement Ubiza"
                  value={payment.id}
                />

                <PaymentDetail
                  label="Créé le"
                  value={formatDate(payment.createdAt)}
                />

                <PaymentDetail
                  label="Initié le"
                  value={formatDate(payment.initiatedAt)}
                />

                <PaymentDetail
                  label="Payé le"
                  value={formatOptionalDate(payment.paidAt)}
                />
              </div>

              {payment.failureReason && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                    Motif d’échec
                  </p>

                  <p className="mt-2 text-sm text-red-100">
                    {payment.failureReason}
                  </p>
                </div>
              )}

              {payment.provider === "MANUAL" && (
                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-100">
                    Ancien paiement manuel conservé uniquement pour
                    l’historique.
                  </p>
                </div>
              )}
            </article>
          ))}
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

function getPurchaseLabel(payment: AdminPayment) {
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

function getProviderLabel(payment: AdminPayment) {
  if (payment.provider === "PAYMENT_PLATFORM") {
    const provider = payment.providerData?.paymentPlatform?.provider?.toUpperCase();

    if (provider === "FAPSHI") {
      return "Payment Platform / Fapshi";
    }

    if (provider === "SASPAY") {
      return "Payment Platform / SasPay";
    }

    return "Payment Platform";
  }

  const labels: Record<Exclude<PaymentProvider, "PAYMENT_PLATFORM">, string> = {
    MANUAL: "Manuel — historique",
    CAMPAY: "CamPay",
  };

  return labels[payment.provider];
}

function getStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    PENDING: "En attente",
    PROCESSING: "En cours",
    SUCCESS: "Réussi",
    FAILED: "Échoué",
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

function formatOptionalDate(value?: string | null) {
  return value ? formatDate(value) : "Non disponible";
}
