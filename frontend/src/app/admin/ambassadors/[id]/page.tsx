"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";

import {
  adminAmbassadorService,
  type AdminAmbassador,
  type AdminPayoutStatus,
} from "@/services/admin-ambassador.service";

import type { AmbassadorStatus } from "@/services/ambassador.service";

interface AmbassadorReferral {
  id: string;
  ambassadorId?: string;
  referredUserId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AmbassadorCommission {
  id: string;
  ambassadorId?: string;
  referralId?: string | null;
  amount: number | string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
}

interface AmbassadorPayout {
  id: string;
  ambassadorId: string;
  amount: number | string;
  status: AdminPayoutStatus;
  paymentReference: string | null;
  requestedAt: string;
  processedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
}

interface AmbassadorListing {
  id: string;
  title: string;
  status: string;
  publishedAt: string | null;
}

interface AdminAmbassadorDetails extends Omit<
  AdminAmbassador,
  "user" | "_count"
> {
  approvedAt: string | null;
  rejectedAt: string | null;
  suspendedAt: string | null;
  identityVerifiedAt: string | null;
  termsAcceptedAt: string | null;

  user: AdminAmbassador["user"] & {
    emailVerifiedAt?: string | null;
    phoneVerifiedAt?: string | null;

    listings: AmbassadorListing[];
  };

  referrals: AmbassadorReferral[];
  commissions: AmbassadorCommission[];
  payouts: AmbassadorPayout[];

  _count?: {
    referrals: number;
    commissions: number;
    payouts: number;
  };

  stats: {
    totalReferrals: number;
    publishedListings: number;
    firstPurchases: number;
    pendingCommissions: number;
    approvedCommissions: number;
    paidCommissions: number;
    conversionRate: number;
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
    paidBalance: number;
  };
}

export default function AdminAmbassadorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [ambassador, setAmbassador] = useState<AdminAmbassadorDetails | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  const [payoutToConfirm, setPayoutToConfirm] =
    useState<AmbassadorPayout | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentReferenceError, setPaymentReferenceError] = useState("");
  const [payoutToReject, setPayoutToReject] = useState<AmbassadorPayout | null>(
    null,
  );

  const [rejectPayoutReason, setRejectPayoutReason] = useState("");
  const [rejectPayoutError, setRejectPayoutError] = useState("");

  const loadAmbassador = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await adminAmbassadorService.getOne(id);

      setAmbassador(response as unknown as AdminAmbassadorDetails);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossible de charger l’ambassadeur.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadAmbassador();
  }, [loadAmbassador]);

  const finances = useMemo(() => {
    const commissions = ambassador?.commissions ?? [];

    const pendingBalance = commissions
      .filter((commission) => commission.status === "PENDING")
      .reduce((sum, commission) => sum + Number(commission.amount || 0), 0);

    const availableBalance = commissions
      .filter((commission) => commission.status === "APPROVED")
      .reduce((sum, commission) => sum + Number(commission.amount || 0), 0);

    const paidBalance = commissions
      .filter((commission) => commission.status === "PAID")
      .reduce((sum, commission) => sum + Number(commission.amount || 0), 0);

    return {
      pendingBalance,
      availableBalance,
      paidBalance,
      totalEarnings: pendingBalance + availableBalance + paidBalance,
    };
  }, [ambassador]);

  async function runAmbassadorAction(
    action: () => Promise<AdminAmbassador>,
    message: string,
  ): Promise<void> {
    if (!ambassador) {
      return;
    }

    setActionId(ambassador.id);
    setError("");
    setSuccessMessage("");

    try {
      await action();
      setSuccessMessage(message);
      await loadAmbassador();
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

  async function handleVerifyIdentity(): Promise<void> {
    if (!ambassador) {
      return;
    }

    const confirmed = window.confirm(
      `Confirmer la vérification de l’identité de ${ambassador.fullName} ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAmbassadorAction(
      () => adminAmbassadorService.verifyIdentity(ambassador.id),
      "L’identité de l’ambassadeur a été vérifiée.",
    );
  }

  async function handleSuspend(): Promise<void> {
    if (!ambassador) {
      return;
    }

    const confirmed = window.confirm(`Suspendre ${ambassador.fullName} ?`);

    if (!confirmed) {
      return;
    }

    await runAmbassadorAction(
      () => adminAmbassadorService.suspend(ambassador.id),
      "L’ambassadeur a été suspendu.",
    );
  }

  async function handleReactivate(): Promise<void> {
    if (!ambassador) {
      return;
    }

    const confirmed = window.confirm(`Réactiver ${ambassador.fullName} ?`);

    if (!confirmed) {
      return;
    }

    await runAmbassadorAction(
      () => adminAmbassadorService.reactivate(ambassador.id),
      "L’ambassadeur a été réactivé.",
    );
  }

  async function handleApprove(): Promise<void> {
    if (!ambassador) {
      return;
    }

    const confirmed = window.confirm(
      `Approuver la candidature de ${ambassador.fullName} ?`,
    );

    if (!confirmed) {
      return;
    }

    await runAmbassadorAction(
      () => adminAmbassadorService.approve(ambassador.id),
      "La candidature a été approuvée.",
    );
  }

  function handleReject(): void {
    if (!ambassador) {
      return;
    }

    setRejectReason("");
    setRejectReasonError("");
    setIsRejectModalOpen(true);
  }

  async function confirmReject(): Promise<void> {
    if (!ambassador) {
      return;
    }

    const cleanReason = rejectReason.trim();

    if (cleanReason.length < 3) {
      setRejectReasonError(
        "La raison du refus doit contenir au moins 3 caractères.",
      );
      return;
    }

    setActionId(ambassador.id);
    setError("");
    setSuccessMessage("");
    setRejectReasonError("");

    try {
      await adminAmbassadorService.reject(ambassador.id, cleanReason);

      setSuccessMessage("La candidature a été refusée.");
      setIsRejectModalOpen(false);
      setRejectReason("");
      await loadAmbassador();
    } catch (actionError) {
      setRejectReasonError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de refuser cette candidature.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleStartPayout(payout: AmbassadorPayout): Promise<void> {
    if (!ambassador?.identityVerifiedAt) {
      setError(
        "L’identité de l’ambassadeur doit être vérifiée avant de traiter le paiement.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Démarrer le traitement du paiement de ${formatMoney(payout.amount)} ?`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(payout.id);
    setError("");
    setSuccessMessage("");

    try {
      await adminAmbassadorService.startPayout(payout.id);
      setSuccessMessage("Le paiement est maintenant en cours de traitement.");
      await loadAmbassador();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de démarrer le paiement.",
      );
    } finally {
      setActionId(null);
    }
  }

  function handleMarkPayoutAsPaid(payout: AmbassadorPayout): void {
    if (!ambassador?.identityVerifiedAt) {
      setError(
        "L’identité de l’ambassadeur doit être vérifiée avant de confirmer le paiement.",
      );
      return;
    }

    setPayoutToConfirm(payout);
    setPaymentReference("");
    setPaymentReferenceError("");
    setError("");
    setSuccessMessage("");
  }

  async function confirmMarkPayoutAsPaid(): Promise<void> {
    if (!payoutToConfirm) {
      return;
    }

    const cleanReference = paymentReference.trim();

    if (cleanReference.length < 3) {
      setPaymentReferenceError(
        "La référence doit contenir au moins 3 caractères.",
      );
      return;
    }

    setActionId(payoutToConfirm.id);
    setPaymentReferenceError("");
    setError("");
    setSuccessMessage("");

    try {
      await adminAmbassadorService.markPayoutAsPaid(
        payoutToConfirm.id,
        cleanReference,
      );

      setSuccessMessage("Le paiement a été marqué comme payé.");
      setPayoutToConfirm(null);
      setPaymentReference("");
      await loadAmbassador();
    } catch (actionError) {
      setPaymentReferenceError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de confirmer le paiement.",
      );
    } finally {
      setActionId(null);
    }
  }

  function handleRejectPayout(payout: AmbassadorPayout): void {
    setPayoutToReject(payout);
    setRejectPayoutReason("");
    setRejectPayoutError("");
    setError("");
    setSuccessMessage("");
  }

  async function confirmRejectPayout(): Promise<void> {
    if (!payoutToReject) {
      return;
    }

    const reason = rejectPayoutReason.trim();

    if (reason.length < 3) {
      setRejectPayoutError(
        "La raison du refus doit contenir au moins 3 caractères.",
      );
      return;
    }

    setActionId(payoutToReject.id);
    setRejectPayoutError("");

    try {
      await adminAmbassadorService.rejectPayout(payoutToReject.id, reason);

      setPayoutToReject(null);
      setRejectPayoutReason("");
      setSuccessMessage(
        "Le retrait a été refusé et les commissions ont été annulées.",
      );

      await loadAmbassador();
    } catch (actionError) {
      setRejectPayoutError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de refuser ce retrait.",
      );
    } finally {
      setActionId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-zinc-400">
          Chargement de l’ambassadeur...
        </div>
      </main>
    );
  }

  if (error && !ambassador) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <ErrorMessage message={error} />
      </main>
    );
  }

  if (!ambassador) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-zinc-400">
          Ambassadeur introuvable.
        </div>
      </main>
    );
  }

  const displayName =
    ambassador.user.profile?.displayName ??
    ambassador.fullName ??
    "Ambassadeur";

  const username = ambassador.user.profile?.username;
  const isProcessingAmbassador = actionId === ambassador.id;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/admin/ambassadors"
            className="text-sm font-semibold text-fuchsia-400 transition hover:text-fuchsia-300"
          >
            ← Retour aux ambassadeurs
          </Link>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Administration
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-white sm:text-4xl">
              {displayName}
            </h1>

            <AmbassadorStatusBadge status={ambassador.status} />

            <IdentityBadge
              isVerified={Boolean(ambassador.identityVerifiedAt)}
            />
          </div>

          <div className="mt-3 space-y-1 text-sm text-zinc-400">
            {username ? <p>@{username}</p> : null}
            <p>{ambassador.user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ambassador.status === "PENDING" ? (
            <>
              <AdminActionButton
                label="Approuver"
                disabled={isProcessingAmbassador}
                onClick={() => void handleApprove()}
                variant="success"
              />

              <AdminActionButton
                label="Refuser"
                disabled={isProcessingAmbassador}
                onClick={() => void handleReject()}
                variant="danger"
              />
            </>
          ) : null}

          {ambassador.status === "ACTIVE" && !ambassador.identityVerifiedAt ? (
            <AdminActionButton
              label="Vérifier l’identité"
              disabled={isProcessingAmbassador}
              onClick={() => void handleVerifyIdentity()}
              variant="primary"
            />
          ) : null}

          {ambassador.status === "ACTIVE" ? (
            <AdminActionButton
              label="Suspendre"
              disabled={isProcessingAmbassador}
              onClick={() => void handleSuspend()}
              variant="danger"
            />
          ) : null}

          {ambassador.status === "SUSPENDED" ? (
            <AdminActionButton
              label="Réactiver"
              disabled={isProcessingAmbassador}
              onClick={() => void handleReactivate()}
              variant="success"
            />
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Filleuls"
          value={ambassador.stats.totalReferrals}
          icon="👥"
        />

        <KpiCard
          label="Annonces publiées"
          value={ambassador.stats.publishedListings}
          icon="📝"
        />

        <KpiCard
          label="Premiers achats"
          value={ambassador.stats.firstPurchases}
          icon="🛒"
        />

        <KpiCard
          label="Taux de conversion"
          value={`${ambassador.stats.conversionRate} %`}
          icon="📈"
        />

        <FinancialCard
          label="Gains totaux"
          value={ambassador.stats.totalEarnings}
        />

        <FinancialCard
          label="Disponible"
          value={ambassador.stats.availableBalance}
        />

        <FinancialCard
          label="En attente"
          value={ambassador.stats.pendingBalance}
        />

        <FinancialCard label="Déjà payé" value={ambassador.stats.paidBalance} />
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <SectionHeader
          title="Informations de l’ambassadeur"
          description="Identité, coordonnées et état du compte."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Nom complet" value={ambassador.fullName} />
          <InfoItem label="Pays" value={ambassador.country} />

          <InfoItem label="Mobile Money" value={ambassador.mobileMoneyNumber} />

          <InfoItem
            label="Pièce d’identité"
            value={ambassador.identityNumber}
          />

          <InfoItem label="Code ambassadeur" value={ambassador.referralCode} />

          <InfoItem
            label="Paiement minimum"
            value={formatMoney(ambassador.minimumPayout)}
          />

          <InfoItem
            label="Identité"
            value={
              ambassador.identityVerifiedAt
                ? `Vérifiée le ${formatDate(ambassador.identityVerifiedAt)}`
                : "Non vérifiée"
            }
          />

          <InfoItem
            label="Email"
            value={
              ambassador.user.emailVerifiedAt
                ? `Vérifié le ${formatDate(ambassador.user.emailVerifiedAt)}`
                : "Non vérifié"
            }
          />

          <InfoItem
            label="Candidature"
            value={formatDate(ambassador.createdAt)}
          />

          <InfoItem
            label="Approbation"
            value={formatDate(ambassador.approvedAt)}
          />

          <InfoItem
            label="Suspension"
            value={formatDate(ambassador.suspendedAt)}
          />

          <InfoItem
            label="Conditions acceptées"
            value={formatDate(ambassador.termsAcceptedAt)}
          />
        </div>

        {ambassador.rejectionReason ? (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
              Motif du refus
            </p>

            <p className="mt-2 text-sm text-red-100">
              {ambassador.rejectionReason}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <SectionHeader
          title="Annonces"
          description={`${ambassador.user.listings?.length ?? 0} annonce(s) liée(s) à ce compte.`}
        />

        <div className="mt-6">
          {ambassador.user.listings?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <TableHeading>Annonce</TableHeading>
                    <TableHeading>Statut</TableHeading>
                    <TableHeading>Publication</TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {ambassador.user.listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <TableCell>{listing.title}</TableCell>

                      <TableCell>
                        <GenericStatusBadge status={listing.status} />
                      </TableCell>

                      <TableCell>{formatDate(listing.publishedAt)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucune annonce trouvée." />
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <SectionHeader
          title="Filleuls"
          description={`${ambassador.referrals?.length ?? 0} filleul(s) enregistré(s).`}
        />

        <div className="mt-6">
          {ambassador.referrals?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <TableHeading>Identifiant du filleul</TableHeading>
                    <TableHeading>Date d’inscription</TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {ambassador.referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <TableCell>
                        {referral.referredUserId ?? referral.id}
                      </TableCell>

                      <TableCell>{formatDate(referral.createdAt)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucun filleul enregistré." />
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <SectionHeader
          title="Commissions"
          description={`${ambassador.commissions?.length ?? 0} commission(s) enregistrée(s).`}
        />

        <div className="mt-6">
          {ambassador.commissions?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <TableHeading>Date</TableHeading>
                    <TableHeading>Montant</TableHeading>
                    <TableHeading>Statut</TableHeading>
                    <TableHeading>Date de paiement</TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {ambassador.commissions.map((commission) => (
                    <tr
                      key={commission.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <TableCell>{formatDate(commission.createdAt)}</TableCell>

                      <TableCell>{formatMoney(commission.amount)}</TableCell>

                      <TableCell>
                        <GenericStatusBadge status={commission.status} />
                      </TableCell>

                      <TableCell>
                        {commission.status === "PAID"
                          ? formatDate(commission.paidAt)
                          : "Non renseigné"}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucune commission enregistrée." />
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <SectionHeader
          title="Paiements"
          description={`${ambassador.payouts?.length ?? 0} demande(s) de paiement enregistrée(s).`}
        />

        {!ambassador.identityVerifiedAt ? (
          <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200">
            L’identité doit être vérifiée avant de pouvoir traiter ou confirmer
            un paiement.
          </div>
        ) : null}

        <div className="mt-6">
          {ambassador.payouts?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <TableHeading>Montant</TableHeading>
                    <TableHeading>Demandé le</TableHeading>
                    <TableHeading>Traité le</TableHeading>
                    <TableHeading>Payé le</TableHeading>
                    <TableHeading>Référence</TableHeading>
                    <TableHeading>Statut</TableHeading>
                    <TableHeading>Action</TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {ambassador.payouts.map((payout) => {
                    const isProcessing = actionId === payout.id;

                    return (
                      <tr
                        key={payout.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <TableCell>{formatMoney(payout.amount)}</TableCell>

                        <TableCell>{formatDate(payout.requestedAt)}</TableCell>

                        <TableCell>{formatDate(payout.processedAt)}</TableCell>

                        <TableCell>{formatDate(payout.paidAt)}</TableCell>

                        <TableCell>{payout.paymentReference || "—"}</TableCell>

                        <TableCell>
                          <GenericStatusBadge status={payout.status} />
                        </TableCell>

                        <TableCell>
                          <div className="flex min-w-max gap-2">
                            {payout.status === "PENDING" ? (
                              <SmallActionButton
                                label={
                                  isProcessing ? "Traitement..." : "Démarrer"
                                }
                                disabled={
                                  isProcessing || !ambassador.identityVerifiedAt
                                }
                                onClick={() => void handleStartPayout(payout)}
                              />
                            ) : null}

                            {payout.status === "PROCESSING" ? (
                              <SmallActionButton
                                label={
                                  isProcessing
                                    ? "Traitement..."
                                    : "Marquer payé"
                                }
                                disabled={
                                  isProcessing || !ambassador.identityVerifiedAt
                                }
                                onClick={() =>
                                  void handleMarkPayoutAsPaid(payout)
                                }
                              />
                            ) : null}

                            {payout.status === "PENDING" ||
                            payout.status === "PROCESSING" ? (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleRejectPayout(payout)}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isProcessing
                                  ? "Traitement..."
                                  : "Refuser pour fraude"}
                              </button>
                            ) : null}

                            {payout.status === "PAID" ? (
                              <span className="text-sm font-semibold text-emerald-300">
                                Terminé
                              </span>
                            ) : null}

                            {payout.status === "CANCELLED" ? (
                              <span className="text-sm font-semibold text-red-300">
                                Refusé
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucune demande de paiement." />
          )}
        </div>
      </section>

      {isRejectModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-ambassador-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void confirmReject();
            }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <h2
              id="reject-ambassador-title"
              className="text-xl font-black text-white"
            >
              Refuser la candidature
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Indique la raison du refus. Elle sera conservée dans le dossier de
              l’ambassadeur.
            </p>

            <label
              htmlFor="reject-reason"
              className="mt-6 block text-sm font-semibold text-white"
            >
              Raison du refus
            </label>

            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                setRejectReasonError("");
              }}
              rows={4}
              maxLength={500}
              autoFocus
              disabled={actionId === ambassador.id}
              placeholder="Exemple : informations incomplètes ou non conformes."
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-red-500 disabled:opacity-50"
            />

            {rejectReasonError ? (
              <p className="mt-3 text-sm text-red-300">{rejectReasonError}</p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setRejectReasonError("");
                }}
                disabled={actionId === ambassador.id}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  actionId === ambassador.id || rejectReason.trim().length < 3
                }
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId === ambassador.id
                  ? "Refus en cours..."
                  : "Confirmer le refus"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {payoutToConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-payout-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void confirmMarkPayoutAsPaid();
            }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <h2
              id="confirm-payout-title"
              className="text-xl font-black text-white"
            >
              Confirmer le paiement
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Confirme uniquement après avoir réellement transféré{" "}
              <strong className="text-white">
                {formatMoney(payoutToConfirm.amount)}
              </strong>{" "}
              par Mobile Money.
            </p>

            <label
              htmlFor="payment-reference"
              className="mt-6 block text-sm font-semibold text-white"
            >
              Référence de transaction
            </label>

            <input
              id="payment-reference"
              type="text"
              value={paymentReference}
              onChange={(event) => {
                setPaymentReference(event.target.value);
                setPaymentReferenceError("");
              }}
              maxLength={150}
              autoFocus
              disabled={actionId === payoutToConfirm.id}
              placeholder="Exemple : MP260803123456"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-emerald-500 disabled:opacity-50"
            />

            {paymentReferenceError ? (
              <p className="mt-3 text-sm text-red-300">
                {paymentReferenceError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPayoutToConfirm(null);
                  setPaymentReference("");
                  setPaymentReferenceError("");
                }}
                disabled={actionId === payoutToConfirm.id}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  actionId === payoutToConfirm.id ||
                  paymentReference.trim().length < 3
                }
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId === payoutToConfirm.id
                  ? "Confirmation..."
                  : "Marquer comme payé"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {payoutToReject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void confirmRejectPayout();
            }}
            className="w-full max-w-lg rounded-3xl border border-red-500/20 bg-zinc-950 p-6 shadow-2xl"
          >
            <h2 className="text-xl font-black text-white">
              Refuser le retrait pour fraude
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60">
              Le retrait de {formatMoney(payoutToReject.amount)} sera annulé.
              Les commissions associées seront également annulées
              définitivement.
            </p>

            <label
              htmlFor="reject-payout-reason"
              className="mt-6 block text-sm font-semibold text-white"
            >
              Motif du refus
            </label>

            <textarea
              id="reject-payout-reason"
              value={rejectPayoutReason}
              onChange={(event) => {
                setRejectPayoutReason(event.target.value);
                setRejectPayoutError("");
              }}
              placeholder="Exemple : faux comptes ou auto-parrainage détecté"
              rows={4}
              autoFocus
              disabled={actionId === payoutToReject.id}
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-red-500"
            />

            {rejectPayoutError ? (
              <p className="mt-3 text-sm text-red-300">{rejectPayoutError}</p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={actionId === payoutToReject.id}
                onClick={() => {
                  setPayoutToReject(null);
                  setRejectPayoutReason("");
                  setRejectPayoutError("");
                }}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                Retour
              </button>

              <button
                type="submit"
                disabled={
                  actionId === payoutToReject.id ||
                  rejectPayoutReason.trim().length < 3
                }
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionId === payoutToReject.id
                  ? "Refus en cours..."
                  : "Confirmer le refus"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
}

function KpiCard({ label, value, icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>

          <p className="mt-3 text-2xl font-black text-white">{value}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FinancialCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-white sm:text-3xl">
        {formatMoney(value)}
      </p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-zinc-200">
        {value || "Non renseigné"}
      </p>
    </div>
  );
}

function AmbassadorStatusBadge({ status }: { status: AmbassadorStatus }) {
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
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function IdentityBadge({ isVerified }: { isVerified: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        isVerified
          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      {isVerified ? "Identité vérifiée" : "Identité non vérifiée"}
    </span>
  );
}

function GenericStatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toUpperCase();

  const statusClasses: Record<string, string> = {
    ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    PUBLISHED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    PAID: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",

    PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    PROCESSING: "border-sky-500/30 bg-sky-500/10 text-sky-300",

    FAILED: "border-red-500/30 bg-red-500/10 text-red-300",
    REJECTED: "border-red-500/30 bg-red-500/10 text-red-300",
    CANCELLED: "border-red-500/30 bg-red-500/10 text-red-300",

    SUSPENDED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    DRAFT: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
    PAUSED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        statusClasses[normalizedStatus] ??
        "border-white/10 bg-white/5 text-zinc-300"
      }`}
    >
      {translateStatus(normalizedStatus)}
    </span>
  );
}

function AdminActionButton({
  label,
  disabled,
  onClick,
  variant,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  variant: "primary" | "success" | "danger";
}) {
  const classes = {
    primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-500",
    success: "bg-emerald-500 text-black hover:bg-emerald-400",
    danger: "bg-red-500 text-white hover:bg-red-400",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes[variant]}`}
    >
      {label}
    </button>
  );
}

function SmallActionButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function TableHeading({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-zinc-300">{children}</td>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
      {message}
    </div>
  );
}

function formatMoney(amount: number | string): string {
  const parsedAmount = Number(amount);

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsedAmount) ? parsedAmount : 0)} FCFA`;
}

function formatDate(date: string | null | undefined): string {
  if (!date) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function translateStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    PROCESSING: "En traitement",
    APPROVED: "Disponible",
    PAID: "Payé",
    FAILED: "Échoué",
    CANCELLED: "Annulé",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
    REJECTED: "Refusé",
    PUBLISHED: "Publiée",
    DRAFT: "Brouillon",
    PAUSED: "En pause",
  };

  return labels[status] ?? status;
}
