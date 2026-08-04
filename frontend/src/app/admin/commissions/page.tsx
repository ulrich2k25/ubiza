"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  adminAmbassadorService,
  type AdminCommission,
} from "@/services/admin-ambassador.service";

type CommissionStatus = AdminCommission["status"];
type CommissionFilter = "ALL" | CommissionStatus;
type CommissionAction = "APPROVE" | "CANCEL";

const ITEMS_PER_PAGE = 10;

const filters: Array<{
  label: string;
  value: CommissionFilter;
}> = [
  { label: "Toutes", value: "ALL" },
  { label: "En attente", value: "PENDING" },
  { label: "Disponibles", value: "APPROVED" },
  { label: "Payées", value: "PAID" },
  { label: "Annulées", value: "CANCELLED" },
];

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<CommissionFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isApprovingEligible, setIsApprovingEligible] = useState(false);
  const [activeAction, setActiveAction] = useState<{
    commissionId: string;
    action: CommissionAction;
  } | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCommissions = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await adminAmbassadorService.getAllCommissions();
      setCommissions(response);
      setCurrentPage(1);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les commissions.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCommissions();
  }, [loadCommissions]);

  const filteredCommissions = useMemo(() => {
    if (selectedStatus === "ALL") {
      return commissions;
    }

    return commissions.filter(
      (commission) => commission.status === selectedStatus,
    );
  }, [commissions, selectedStatus]);

  const stats = useMemo(() => {
    const pending = commissions.filter(
      (commission) => commission.status === "PENDING",
    );

    const approved = commissions.filter(
      (commission) => commission.status === "APPROVED",
    );

    const paid = commissions.filter(
      (commission) => commission.status === "PAID",
    );

    const cancelled = commissions.filter(
      (commission) => commission.status === "CANCELLED",
    );

    return {
      total: commissions.length,
      pendingCount: pending.length,
      pendingAmount: sumCommissionAmounts(pending),
      approvedCount: approved.length,
      approvedAmount: sumCommissionAmounts(approved),
      paidCount: paid.length,
      paidAmount: sumCommissionAmounts(paid),
      cancelledCount: cancelled.length,
      cancelledAmount: sumCommissionAmounts(cancelled),
    };
  }, [commissions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCommissions.length / ITEMS_PER_PAGE),
  );

  const visibleCommissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredCommissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCommissions, currentPage]);

  function clearMessages(): void {
    setError("");
    setSuccessMessage("");
  }

  async function handleApproveEligible(): Promise<void> {
    const confirmed = window.confirm(
      "Approuver toutes les commissions actuellement éligibles ?",
    );

    if (!confirmed) {
      return;
    }

    setIsApprovingEligible(true);
    clearMessages();

    try {
      const result = await adminAmbassadorService.approveEligibleCommissions();

      setSuccessMessage(
        result.approvedCount > 0
          ? `${result.approvedCount} commission(s) approuvée(s), pour un total de ${formatMoney(
              result.approvedAmount,
            )}.`
          : result.message || "Aucune commission éligible à approuver.",
      );

      await loadCommissions();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : "Impossible d’approuver les commissions éligibles.",
      );
    } finally {
      setIsApprovingEligible(false);
    }
  }

  async function handleApproveCommission(
    commission: AdminCommission,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Approuver la commission de ${formatMoney(
        Number(commission.amount),
      )} pour ${commission.ambassador.fullName || "cet ambassadeur"} ?`,
    );

    if (!confirmed) {
      return;
    }

    setActiveAction({
      commissionId: commission.id,
      action: "APPROVE",
    });
    clearMessages();

    try {
      await adminAmbassadorService.approveCommission(commission.id);

      setSuccessMessage("La commission a été approuvée.");
      await loadCommissions();
    } catch (approvalError) {
      setError(
        approvalError instanceof Error
          ? approvalError.message
          : "Impossible d’approuver cette commission.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCancelCommission(
    commission: AdminCommission,
  ): Promise<void> {
    const reason = window.prompt("Indiquez la raison de l’annulation :", "");

    if (reason === null) {
      return;
    }

    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      setError(
        "La raison de l’annulation doit contenir au moins 3 caractères.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Confirmer l’annulation de cette commission de ${formatMoney(
        Number(commission.amount),
      )} ?`,
    );

    if (!confirmed) {
      return;
    }

    setActiveAction({
      commissionId: commission.id,
      action: "CANCEL",
    });
    clearMessages();

    try {
      await adminAmbassadorService.cancelCommission(
        commission.id,
        normalizedReason,
      );

      setSuccessMessage("La commission a été annulée.");
      await loadCommissions();
    } catch (cancellationError) {
      setError(
        cancellationError instanceof Error
          ? cancellationError.message
          : "Impossible d’annuler cette commission.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  const isAnyActionRunning = isApprovingEligible || activeAction !== null;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Commissions ambassadeurs
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Vérifiez, approuvez ou annulez chaque commission avant son
            intégration dans un paiement ambassadeur.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadCommissions()}
            disabled={isLoading || isAnyActionRunning}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Chargement..." : "Actualiser"}
          </button>

          <button
            type="button"
            onClick={() => void handleApproveEligible()}
            disabled={
              isLoading || isAnyActionRunning || stats.pendingCount === 0
            }
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApprovingEligible
              ? "Approbation..."
              : "Approuver les commissions éligibles"}
          </button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Commissions"
          value={stats.total.toString()}
          subtitle="Total enregistré"
        />

        <StatCard
          label="En attente"
          value={formatMoney(stats.pendingAmount)}
          subtitle={`${stats.pendingCount} commission${
            stats.pendingCount > 1 ? "s" : ""
          }`}
          tone="pending"
        />

        <StatCard
          label="Disponibles"
          value={formatMoney(stats.approvedAmount)}
          subtitle={`${stats.approvedCount} commission${
            stats.approvedCount > 1 ? "s" : ""
          }`}
          tone="approved"
        />

        <StatCard
          label="Déjà payées"
          value={formatMoney(stats.paidAmount)}
          subtitle={`${stats.paidCount} commission${
            stats.paidCount > 1 ? "s" : ""
          }`}
          tone="paid"
        />

        <StatCard
          label="Annulées"
          value={formatMoney(stats.cancelledAmount)}
          subtitle={`${stats.cancelledCount} commission${
            stats.cancelledCount > 1 ? "s" : ""
          }`}
          tone="cancelled"
        />
      </section>

      <section className="mt-7">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => {
            const isSelected = selectedStatus === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setSelectedStatus(filter.value);
                  setCurrentPage(1);
                  clearMessages();
                }}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-8">
        {isLoading ? (
          <EmptyState message="Chargement des commissions..." />
        ) : filteredCommissions.length === 0 ? (
          <EmptyState message="Aucune commission dans cette catégorie." />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] border-collapse text-left">
                  <thead className="border-b border-white/10 bg-black/20">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <th className="px-5 py-4">Ambassadeur</th>
                      <th className="px-5 py-4">Filleul</th>
                      <th className="px-5 py-4">Achat</th>
                      <th className="px-5 py-4">Commission</th>
                      <th className="px-5 py-4">Créée le</th>
                      <th className="px-5 py-4">Statut</th>
                      <th className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {visibleCommissions.map((commission) => (
                      <CommissionTableRow
                        key={commission.id}
                        commission={commission}
                        activeAction={activeAction}
                        onApprove={handleApproveCommission}
                        onCancel={handleCancelCommission}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 lg:hidden">
              {visibleCommissions.map((commission) => (
                <CommissionMobileCard
                  key={commission.id}
                  commission={commission}
                  activeAction={activeAction}
                  onApprove={handleApproveCommission}
                  onCancel={handleCancelCommission}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCommissions.length}
              onChange={setCurrentPage}
            />
          </>
        )}
      </section>
    </main>
  );
}

function CommissionTableRow({
  commission,
  activeAction,
  onApprove,
  onCancel,
}: {
  commission: AdminCommission;
  activeAction: {
    commissionId: string;
    action: CommissionAction;
  } | null;
  onApprove: (commission: AdminCommission) => Promise<void>;
  onCancel: (commission: AdminCommission) => Promise<void>;
}) {
  const ambassadorName = commission.ambassador.fullName || "Ambassadeur";

  const referredProfile = commission.referral.referredUser.profile;

  const referredName =
    referredProfile?.displayName ||
    referredProfile?.username ||
    commission.referral.referredUser.email;

  return (
    <tr className="transition hover:bg-white/[0.035]">
      <td className="px-5 py-4">
        <div className="max-w-[220px]">
          <p className="truncate font-bold text-white">{ambassadorName}</p>

          {commission.ambassador.referralCode ? (
            <p className="mt-1 truncate text-xs text-zinc-500">
              Code : {commission.ambassador.referralCode}
            </p>
          ) : null}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="max-w-[240px]">
          <p className="truncate font-semibold text-zinc-200">{referredName}</p>

          <p className="mt-1 truncate text-xs text-zinc-500">
            {commission.referral.referredUser.email}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="font-semibold text-white">
          {getPurchaseLabel(commission.payment.purpose)}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Paiement : {formatMoney(Number(commission.payment.amount))}
        </p>
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-lg font-black text-emerald-300">
        {formatMoney(Number(commission.amount))}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-400">
        {formatDate(commission.createdAt)}
      </td>

      <td className="px-5 py-4">
        <CommissionStatusBadge status={commission.status} />

        {commission.status === "CANCELLED" && commission.cancellationReason ? (
          <p
            className="mt-2 max-w-[220px] text-xs text-red-300"
            title={commission.cancellationReason}
          >
            {commission.cancellationReason}
          </p>
        ) : null}
      </td>

      <td className="px-5 py-4">
        <CommissionActions
          commission={commission}
          activeAction={activeAction}
          onApprove={onApprove}
          onCancel={onCancel}
        />
      </td>
    </tr>
  );
}

function CommissionMobileCard({
  commission,
  activeAction,
  onApprove,
  onCancel,
}: {
  commission: AdminCommission;
  activeAction: {
    commissionId: string;
    action: CommissionAction;
  } | null;
  onApprove: (commission: AdminCommission) => Promise<void>;
  onCancel: (commission: AdminCommission) => Promise<void>;
}) {
  const referredProfile = commission.referral.referredUser.profile;

  const referredName =
    referredProfile?.displayName ||
    referredProfile?.username ||
    commission.referral.referredUser.email;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-white">
            {commission.ambassador.fullName || "Ambassadeur"}
          </p>

          <p className="mt-1 truncate text-sm text-zinc-400">
            Filleul : {referredName}
          </p>
        </div>

        <CommissionStatusBadge status={commission.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MobileMetric
          label="Commission"
          value={formatMoney(Number(commission.amount))}
        />

        <MobileMetric
          label="Achat"
          value={getPurchaseLabel(commission.payment.purpose)}
        />

        <MobileMetric
          label="Montant payé"
          value={formatMoney(Number(commission.payment.amount))}
        />

        <MobileMetric
          label="Date"
          value={formatShortDate(commission.createdAt)}
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Filleul
        </p>

        <p className="mt-2 break-all text-sm font-medium text-zinc-200">
          {commission.referral.referredUser.email}
        </p>
      </div>

      {commission.status === "CANCELLED" && commission.cancellationReason ? (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
            Raison de l’annulation
          </p>

          <p className="mt-2 text-sm text-red-100">
            {commission.cancellationReason}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <CommissionActions
          commission={commission}
          activeAction={activeAction}
          onApprove={onApprove}
          onCancel={onCancel}
          fullWidth
        />
      </div>
    </article>
  );
}

function CommissionActions({
  commission,
  activeAction,
  onApprove,
  onCancel,
  fullWidth = false,
}: {
  commission: AdminCommission;
  activeAction: {
    commissionId: string;
    action: CommissionAction;
  } | null;
  onApprove: (commission: AdminCommission) => Promise<void>;
  onCancel: (commission: AdminCommission) => Promise<void>;
  fullWidth?: boolean;
}) {
  const isCurrentCommission = activeAction?.commissionId === commission.id;

  const isApproving = isCurrentCommission && activeAction?.action === "APPROVE";

  const isCancelling = isCurrentCommission && activeAction?.action === "CANCEL";

  const isBusy = activeAction !== null;

  if (commission.status === "PAID" || commission.status === "CANCELLED") {
    return (
      <span className="text-xs text-zinc-500">Aucune action disponible</span>
    );
  }

  return (
    <div
      className={`flex gap-2 ${
        fullWidth ? "flex-col sm:flex-row" : "flex-col"
      }`}
    >
      {commission.status === "PENDING" ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => void onApprove(commission)}
          className={`rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            fullWidth ? "flex-1" : ""
          }`}
        >
          {isApproving ? "Approbation..." : "Approuver"}
        </button>
      ) : null}

      <button
        type="button"
        disabled={isBusy}
        onClick={() => void onCancel(commission)}
        className={`rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          fullWidth ? "flex-1" : ""
        }`}
      >
        {isCancelling ? "Annulation..." : "Annuler"}
      </button>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  tone = "default",
}: {
  label: string;
  value: string;
  subtitle: string;
  tone?: "default" | "pending" | "approved" | "paid" | "cancelled";
}) {
  const toneClasses = {
    default: "text-white",
    pending: "text-amber-300",
    approved: "text-emerald-300",
    paid: "text-fuchsia-300",
    cancelled: "text-red-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className={`mt-2 text-2xl font-black ${toneClasses[tone]}`}>{value}</p>

      <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-zinc-500">{label}</p>

      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  const classes: Record<CommissionStatus, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    PAID: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  const labels: Record<CommissionStatus, string> = {
    PENDING: "En attente",
    APPROVED: "Disponible",
    PAID: "Payée",
    CANCELLED: "Annulée",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
      <div className="text-5xl">💰</div>

      <p className="mt-5 text-sm text-zinc-400">{message}</p>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-5 text-sm text-zinc-500">
        {totalItems} commission{totalItems > 1 ? "s" : ""} affichée
        {totalItems > 1 ? "s" : ""}.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">
        Page {currentPage} sur {totalPages} · {totalItems} commissions
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onChange(currentPage - 1)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Précédent
        </button>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onChange(currentPage + 1)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

function sumCommissionAmounts(commissions: AdminCommission[]): number {
  return commissions.reduce(
    (sum, commission) => sum + Number(commission.amount),
    0,
  );
}

function getPurchaseLabel(purpose: string): string {
  if (purpose === "PREMIUM") {
    return "Premium";
  }

  if (purpose === "BOOST") {
    return "Boost";
  }

  return purpose || "Achat";
}

function formatMoney(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
