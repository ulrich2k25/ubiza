"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  adminAmbassadorService,
  type AdminAmbassadorPayout,
  type AdminPayoutStatus,
} from "@/services/admin-ambassador.service";

export default function AdminAmbassadorPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminAmbassadorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayouts(): Promise<void> {
      setIsLoading(true);
      setError("");

      try {
        const response = await adminAmbassadorService.getAllPayouts();
        setPayouts(response);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger les retraits.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadPayouts();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <Link
        href="/admin"
        className="text-sm font-semibold text-fuchsia-400 transition hover:text-fuchsia-300"
      >
        ← Retour à l’administration
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
        Administration
      </p>

      <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
        Retraits ambassadeurs
      </h1>

      <p className="mt-3 text-sm text-zinc-400">
        {isLoading
          ? "Chargement des retraits..."
          : `${payouts.length} demande(s) de retrait enregistrée(s).`}
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!isLoading && !error ? (
        <section className="mt-8">
          {payouts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
              <div className="text-5xl">📤</div>

              <p className="mt-5 text-sm text-zinc-400">
                Aucune demande de retrait enregistrée.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="border-b border-white/10 bg-black/20">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <th className="px-5 py-4">Ambassadeur</th>
                      <th className="px-5 py-4">Montant</th>
                      <th className="px-5 py-4">Demandé le</th>
                      <th className="px-5 py-4">Traité le</th>
                      <th className="px-5 py-4">Référence</th>
                      <th className="px-5 py-4">Statut</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {payouts.map((payout) => {
                      const displayName =
                        payout.ambassador.user.profile?.displayName ||
                        payout.ambassador.user.profile?.username ||
                        payout.ambassador.fullName ||
                        "Ambassadeur";

                      return (
                        <tr
                          key={payout.id}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/ambassadors/${payout.ambassador.id}`}
                              className="font-bold text-white transition hover:text-fuchsia-300"
                            >
                              {displayName}
                            </Link>

                            <p className="mt-1 text-xs text-zinc-500">
                              {payout.ambassador.user.email}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {payout.ambassador.mobileMoneyNumber ||
                                "Numéro non renseigné"}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-black text-white">
                            {formatMoney(payout.amount)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-300">
                            {formatDate(payout.requestedAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-300">
                            {formatDate(payout.processedAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-300">
                            {payout.paymentReference || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <PayoutStatusBadge status={payout.status} />
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/ambassadors/${payout.ambassador.id}`}
                              className="inline-flex rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-500"
                            >
                              Voir et traiter
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

function PayoutStatusBadge({ status }: { status: AdminPayoutStatus }) {
  const classes: Record<AdminPayoutStatus, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    PROCESSING: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    FAILED: "border-red-500/30 bg-red-500/10 text-red-300",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  const labels: Record<AdminPayoutStatus, string> = {
    PENDING: "En attente",
    PROCESSING: "En traitement",
    PAID: "Payé",
    FAILED: "Échoué",
    CANCELLED: "Refusé",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatMoney(amount: number | string): string {
  const parsedAmount = Number(amount);

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsedAmount) ? parsedAmount : 0)} FCFA`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
