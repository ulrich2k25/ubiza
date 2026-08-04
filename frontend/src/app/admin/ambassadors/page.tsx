"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  adminAmbassadorService,
  type AdminAmbassador,
} from "@/services/admin-ambassador.service";

import type { AmbassadorStatus } from "@/services/ambassador.service";

type FilterStatus = "ALL" | AmbassadorStatus;

const ITEMS_PER_PAGE = 10;

const filters: Array<{
  label: string;
  value: FilterStatus;
}> = [
  {
    label: "Toutes",
    value: "ALL",
  },
  {
    label: "En attente",
    value: "PENDING",
  },
  {
    label: "Actives",
    value: "ACTIVE",
  },
  {
    label: "Refusées",
    value: "REJECTED",
  },
  {
    label: "Suspendues",
    value: "SUSPENDED",
  },
];

export default function AdminAmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<AdminAmbassador[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAmbassadors = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await adminAmbassadorService.getAll(
        selectedStatus === "ALL" ? undefined : selectedStatus,
      );

      setAmbassadors(response);
      setCurrentPage(1);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger les candidatures.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAmbassadors();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAmbassadors]);

  const stats = useMemo(() => {
    return {
      total: ambassadors.length,
      pending: ambassadors.filter(
        (ambassador) => ambassador.status === "PENDING",
      ).length,
      active: ambassadors.filter((ambassador) => ambassador.status === "ACTIVE")
        .length,
      rejected: ambassadors.filter(
        (ambassador) => ambassador.status === "REJECTED",
      ).length,
      suspended: ambassadors.filter(
        (ambassador) => ambassador.status === "SUSPENDED",
      ).length,
    };
  }, [ambassadors]);

  const totalPages = Math.max(
    1,
    Math.ceil(ambassadors.length / ITEMS_PER_PAGE),
  );

  const visibleAmbassadors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return ambassadors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [ambassadors, currentPage]);

  async function runAction(
    ambassadorId: string,
    action: () => Promise<AdminAmbassador>,
    message: string,
  ): Promise<void> {
    setActionId(ambassadorId);
    setError("");
    setSuccessMessage("");

    try {
      await action();
      setSuccessMessage(message);
      await loadAmbassadors();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleApprove(ambassador: AdminAmbassador): Promise<void> {
    const confirmed = window.confirm(
      `Approuver la candidature de ${
        ambassador.fullName ?? "cet ambassadeur"
      } ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      ambassador.id,
      () => adminAmbassadorService.approve(ambassador.id),
      "La candidature a été approuvée.",
    );
  }

  async function handleReject(ambassador: AdminAmbassador): Promise<void> {
    const reason = window.prompt("Indique la raison du refus :");

    if (reason === null) {
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError("La raison du refus est obligatoire.");
      return;
    }

    await runAction(
      ambassador.id,
      () => adminAmbassadorService.reject(ambassador.id, cleanReason),
      "La candidature a été refusée.",
    );
  }

  async function handleSuspend(ambassador: AdminAmbassador): Promise<void> {
    const confirmed = window.confirm(
      `Suspendre ${ambassador.fullName ?? "cet ambassadeur"} ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      ambassador.id,
      () => adminAmbassadorService.suspend(ambassador.id),
      "L’ambassadeur a été suspendu.",
    );
  }

  async function handleReactivate(ambassador: AdminAmbassador): Promise<void> {
    const confirmed = window.confirm(
      `Réactiver ${ambassador.fullName ?? "cet ambassadeur"} ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      ambassador.id,
      () => adminAmbassadorService.reactivate(ambassador.id),
      "L’ambassadeur a été réactivé.",
    );
  }

  async function handleVerifyIdentity(
    ambassador: AdminAmbassador,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Confirmer la vérification de l’identité de ${
        ambassador.fullName ?? "cet ambassadeur"
      } ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      ambassador.id,
      () => adminAmbassadorService.verifyIdentity(ambassador.id),
      "L’identité de l’ambassadeur a été vérifiée.",
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Gestion des ambassadeurs
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Consultez les candidatures, ouvrez les détails et gérez leur statut.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAmbassadors()}
          disabled={isLoading}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Chargement..." : "Actualiser"}
        </button>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Affichés" value={stats.total} />
        <StatCard label="En attente" value={stats.pending} />
        <StatCard label="Actifs" value={stats.active} />
        <StatCard label="Refusés" value={stats.rejected} />
        <StatCard label="Suspendus" value={stats.suspended} />
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
                  setSuccessMessage("");
                  setError("");
                  setCurrentPage(1);
                  setSelectedStatus(filter.value);
                }}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? "bg-fuchsia-600 text-white"
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
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-zinc-400">
            Chargement des candidatures...
          </div>
        ) : ambassadors.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center">
            <div className="text-5xl">📭</div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Aucun ambassadeur
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              Aucun ambassadeur ne correspond à ce filtre.
            </p>
          </div>
        ) : (
          <>
            {/* Tableau pour ordinateur */}
            <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead className="border-b border-white/10 bg-black/20">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <th className="px-5 py-4">Ambassadeur</th>
                      <th className="px-5 py-4">Statut</th>
                      <th className="px-5 py-4">Identité</th>
                      <th className="px-5 py-4 text-center">Filleuls</th>
                      <th className="px-5 py-4 text-center">Commissions</th>
                      <th className="px-5 py-4">Disponible</th>
                      <th className="px-5 py-4">Inscription</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {visibleAmbassadors.map((ambassador) => (
                      <AmbassadorTableRow
                        key={ambassador.id}
                        ambassador={ambassador}
                        isProcessing={actionId === ambassador.id}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onSuspend={handleSuspend}
                        onReactivate={handleReactivate}
                        onVerifyIdentity={handleVerifyIdentity}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cartes compactes pour mobile et tablette */}
            <div className="grid gap-4 lg:hidden">
              {visibleAmbassadors.map((ambassador) => (
                <AmbassadorMobileCard
                  key={ambassador.id}
                  ambassador={ambassador}
                  isProcessing={actionId === ambassador.id}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSuspend={handleSuspend}
                  onReactivate={handleReactivate}
                  onVerifyIdentity={handleVerifyIdentity}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={ambassadors.length}
              onChange={setCurrentPage}
            />
          </>
        )}
      </section>
    </main>
  );
}

interface AmbassadorActionsProps {
  ambassador: AdminAmbassador;
  isProcessing: boolean;
  onApprove: (ambassador: AdminAmbassador) => Promise<void>;
  onReject: (ambassador: AdminAmbassador) => Promise<void>;
  onSuspend: (ambassador: AdminAmbassador) => Promise<void>;
  onReactivate: (ambassador: AdminAmbassador) => Promise<void>;
  onVerifyIdentity: (ambassador: AdminAmbassador) => Promise<void>;
}

function AmbassadorTableRow({
  ambassador,
  isProcessing,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onVerifyIdentity,
}: AmbassadorActionsProps) {
  const profileName =
    ambassador.user.profile?.displayName ??
    ambassador.fullName ??
    "Utilisateur";

  const username = ambassador.user.profile?.username;

  return (
    <tr className="transition hover:bg-white/[0.035]">
      <td className="px-5 py-4">
        <div className="max-w-[220px]">
          <p className="truncate font-bold text-white">{profileName}</p>

          {username ? (
            <p className="mt-1 truncate text-xs text-zinc-400">@{username}</p>
          ) : null}

          <p className="mt-1 truncate text-xs text-zinc-500">
            {ambassador.user.email}
          </p>
        </div>
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={ambassador.status} />
      </td>

      <td className="px-5 py-4">
        <IdentityBadge ambassador={ambassador} />
      </td>

      <td className="px-5 py-4 text-center font-bold text-white">
        {ambassador._count.referrals}
      </td>

      <td className="px-5 py-4 text-center font-bold text-white">
        {ambassador._count.commissions}
      </td>

      <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-300">
        {formatMoney(ambassador.availableBalance)}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-400">
        {formatShortDate(ambassador.createdAt)}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          {ambassador.activePayoutStatus ? (
            <span
              title={
                ambassador.activePayoutStatus === "PENDING"
                  ? "Nouvelle demande de retrait"
                  : "Retrait en cours de traitement"
              }
              aria-label={
                ambassador.activePayoutStatus === "PENDING"
                  ? "Nouvelle demande de retrait"
                  : "Retrait en cours de traitement"
              }
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base ${
                ambassador.activePayoutStatus === "PENDING"
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-sky-500/40 bg-sky-500/10"
              }`}
            >
              🔔
            </span>
          ) : null}

          <Link
            href={`/admin/ambassadors/${ambassador.id}`}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
          >
            Voir
          </Link>

          <CompactActions
            ambassador={ambassador}
            isProcessing={isProcessing}
            onApprove={onApprove}
            onReject={onReject}
            onSuspend={onSuspend}
            onReactivate={onReactivate}
            onVerifyIdentity={onVerifyIdentity}
          />
        </div>
      </td>
    </tr>
  );
}

function AmbassadorMobileCard({
  ambassador,
  isProcessing,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onVerifyIdentity,
}: AmbassadorActionsProps) {
  const profileName =
    ambassador.user.profile?.displayName ??
    ambassador.fullName ??
    "Utilisateur";

  const username = ambassador.user.profile?.username;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-white">{profileName}</p>

          {username ? (
            <p className="mt-1 text-sm text-zinc-400">@{username}</p>
          ) : null}

          <p className="mt-1 break-all text-xs text-zinc-500">
            {ambassador.user.email}
          </p>
        </div>

        <StatusBadge status={ambassador.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MobileMetric label="Filleuls" value={ambassador._count.referrals} />

        <MobileMetric
          label="Commissions"
          value={ambassador._count.commissions}
        />

        <MobileMetric
          label="Disponible"
          value={formatMoney(ambassador.availableBalance)}
        />

        <MobileMetric
          label="Identité"
          value={
            ambassador.identityVerifiedAt
              ? "Vérifiée"
              : ambassador.identityVerificationRequestedAt
                ? "Demandée"
                : "Non demandée"
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/admin/ambassadors/${ambassador.id}`}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
        >
          Voir les détails
        </Link>

        <CompactActions
          ambassador={ambassador}
          isProcessing={isProcessing}
          onApprove={onApprove}
          onReject={onReject}
          onSuspend={onSuspend}
          onReactivate={onReactivate}
          onVerifyIdentity={onVerifyIdentity}
        />
      </div>
    </article>
  );
}

function CompactActions({
  ambassador,
  isProcessing,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onVerifyIdentity,
}: AmbassadorActionsProps) {
  return (
    <>
      {ambassador.status === "PENDING" ? (
        <>
          <SmallActionButton
            label="Approuver"
            disabled={isProcessing}
            onClick={() => void onApprove(ambassador)}
            variant="success"
          />

          <SmallActionButton
            label="Refuser"
            disabled={isProcessing}
            onClick={() => void onReject(ambassador)}
            variant="danger"
          />
        </>
      ) : null}

      {ambassador.status === "ACTIVE" ? (
        <>
          {!ambassador.identityVerifiedAt &&
          ambassador.identityVerificationRequestedAt ? (
            <SmallActionButton
              label="Vérifier"
              disabled={isProcessing}
              onClick={() => void onVerifyIdentity(ambassador)}
              variant="success"
            />
          ) : null}

          <SmallActionButton
            label="Suspendre"
            disabled={isProcessing}
            onClick={() => void onSuspend(ambassador)}
            variant="danger"
          />
        </>
      ) : null}

      {ambassador.status === "SUSPENDED" ? (
        <SmallActionButton
          label="Réactiver"
          disabled={isProcessing}
          onClick={() => void onReactivate(ambassador)}
          variant="success"
        />
      ) : null}

      {isProcessing ? (
        <span className="px-2 py-2 text-xs text-zinc-400">Traitement...</span>
      ) : null}
    </>
  );
}

function IdentityBadge({ ambassador }: { ambassador: AdminAmbassador }) {
  if (ambassador.identityVerifiedAt) {
    return (
      <span className="whitespace-nowrap text-xs font-semibold text-emerald-300">
        ✅ Vérifiée
      </span>
    );
  }

  if (ambassador.identityVerificationRequestedAt) {
    return (
      <span className="whitespace-nowrap text-xs font-semibold text-amber-300">
        🟡 Demandée
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap text-xs text-zinc-500">
      Non demandée
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AmbassadorStatus }) {
  const classes: Record<AmbassadorStatus, string> = {
    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
    SUSPENDED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  };

  const labels: Record<AmbassadorStatus, string> = {
    PENDING: "En attente",
    ACTIVE: "Actif",
    REJECTED: "Refusé",
    SUSPENDED: "Suspendu",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function SmallActionButton({
  label,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant: "success" | "danger";
}) {
  const variantClass =
    variant === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      {label}
    </button>
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
        {totalItems} ambassadeur
        {totalItems > 1 ? "s" : ""} affiché
        {totalItems > 1 ? "s" : ""}.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-zinc-500">
        Page {currentPage} sur {totalPages} · {totalItems} ambassadeurs
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

function formatShortDate(date: string | null): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatMoney(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}
