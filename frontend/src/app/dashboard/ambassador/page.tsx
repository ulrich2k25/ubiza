"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import {
  ambassadorService,
  type Ambassador,
  type ApplyAmbassadorPayload,
  type Payout,
} from "@/services/ambassador.service";

const initialForm: ApplyAmbassadorPayload = {
  fullName: "",
  mobileMoneyNumber: "",
  whatsappNumber: "",
  identityNumber: "",
  country: "Cameroun",
  acceptTerms: false,
};

function getStatusLabel(status: Ambassador["status"]) {
  switch (status) {
    case "PENDING":
      return "Candidature en attente";

    case "ACTIVE":
      return "Ambassadeur actif";

    case "REJECTED":
      return "Candidature refusée";

    case "SUSPENDED":
      return "Compte ambassadeur suspendu";

    default:
      return status;
  }
}

function getStatusDescription(ambassador: Ambassador) {
  switch (ambassador.status) {
    case "PENDING":
      return "Votre candidature est en cours d’examen par l’équipe Ubiza.";

    case "ACTIVE":
      return "Votre candidature a été approuvée. Vous pouvez maintenant parrainer de nouveaux utilisateurs et recevoir des commissions.";

    case "REJECTED":
      return (
        ambassador.rejectionReason ||
        "Votre candidature n’a pas été approuvée. Vous pouvez corriger vos informations et postuler de nouveau."
      );

    case "SUSPENDED":
      return "Votre compte ambassadeur est temporairement suspendu. Contactez l’équipe Ubiza pour obtenir davantage d’informations.";

    default:
      return "";
  }
}

function formatFcfa(value: number | string | undefined) {
  const amount = Number(value ?? 0);

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount)} FCFA`;
}

export default function AmbassadorPage() {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [hasApplied, setHasApplied] = useState(false);

  const [form, setForm] = useState<ApplyAmbassadorPayload>(initialForm);
  const [sameAsMobileMoney, setSameAsMobileMoney] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [visiblePayoutCount, setVisiblePayoutCount] = useState(10);

  useEffect(() => {
    async function loadAmbassador() {
      try {
        setIsLoading(true);
        setError("");

        const [response, payoutHistory] = await Promise.all([
          ambassadorService.getMine(),
          ambassadorService.getMyPayouts(),
        ]);

        setHasApplied(response.hasApplied);
        setAmbassador(response.ambassador);
        setPayouts(payoutHistory);

        if (response.ambassador?.status === "REJECTED") {
          const mobileMoneyNumber = response.ambassador.mobileMoneyNumber || "";

          const whatsappNumber =
            response.ambassador.whatsappNumber || mobileMoneyNumber;

          setForm({
            fullName: response.ambassador.fullName || "",
            mobileMoneyNumber,
            whatsappNumber,
            identityNumber: response.ambassador.identityNumber || "",
            country: response.ambassador.country || "Cameroun",
            acceptTerms: false,
          });

          setSameAsMobileMoney(
            Boolean(mobileMoneyNumber) && mobileMoneyNumber === whatsappNumber,
          );
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Impossible de charger votre candidature.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadAmbassador();
  }, []);

  function updateField<K extends keyof ApplyAmbassadorPayload>(
    field: K,
    value: ApplyAmbassadorPayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleRequestPayout() {
    try {
      setError("");
      setSuccess("");
      setIsRequestingPayout(true);

      await ambassadorService.requestPayout();

      setSuccess("Votre demande de paiement a été envoyée avec succès.");

      const [response, payoutHistory] = await Promise.all([
        ambassadorService.getMine(),
        ambassadorService.getMyPayouts(),
      ]);

      setAmbassador(response.ambassador);
      setPayouts(payoutHistory);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’effectuer la demande de paiement.",
      );
    } finally {
      setIsRequestingPayout(false);
    }
  }

  async function handleRequestIdentityVerification() {
    try {
      setError("");
      setSuccess("");
      setIsRequestingVerification(true);

      await ambassadorService.requestIdentityVerification();

      setSuccess(
        "Votre demande de vérification d'identité a été envoyée avec succès.",
      );

      const response = await ambassadorService.getMine();
      setAmbassador(response.ambassador);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'envoyer votre demande de vérification.",
      );
    } finally {
      setIsRequestingVerification(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.acceptTerms) {
      setError("Vous devez accepter les conditions du programme ambassadeur.");
      return;
    }

    try {
      setIsSubmitting(true);

      const mobileMoneyNumber = form.mobileMoneyNumber.trim();

      const whatsappNumber = sameAsMobileMoney
        ? mobileMoneyNumber
        : form.whatsappNumber.trim();

      if (!whatsappNumber) {
        setError("Veuillez renseigner votre numéro WhatsApp.");
        return;
      }

      const createdAmbassador = await ambassadorService.apply({
        fullName: form.fullName.trim(),
        mobileMoneyNumber,
        whatsappNumber,
        identityNumber: form.identityNumber.trim(),
        country: form.country.trim(),
        acceptTerms: form.acceptTerms,
      });

      setAmbassador(createdAmbassador);
      setHasApplied(true);
      setSuccess("Votre candidature a été envoyée avec succès.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’envoyer votre candidature.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  const sortedPayouts = payouts
    .filter((payout) => ["PAID", "FAILED", "CANCELLED"].includes(payout.status))
    .sort(
      (firstPayout, secondPayout) =>
        new Date(
          secondPayout.processedAt ??
            secondPayout.paidAt ??
            secondPayout.requestedAt,
        ).getTime() -
        new Date(
          firstPayout.processedAt ??
            firstPayout.paidAt ??
            firstPayout.requestedAt,
        ).getTime(),
    );

  const visiblePayouts = sortedPayouts.slice(0, visiblePayoutCount);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black px-5 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm text-white/60">
              Chargement de votre espace ambassadeur...
            </p>
          </div>
        </div>
      </main>
    );
  }
  async function copyReferralCode() {
    if (!ambassador?.referralCode) return;

    await navigator.clipboard.writeText(ambassador.referralCode);

    setCodeCopied(true);

    window.setTimeout(() => {
      setCodeCopied(false);
    }, 2000);
  }
  const canApply = !hasApplied || ambassador?.status === "REJECTED";

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            ← Retour au dashboard
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">
            Programme Ambassadeur
          </p>

          <h1 className="text-3xl font-black md:text-4xl">
            Devenir ambassadeur Ubiza
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Recommandez Ubiza à de nouvelles profils et recevez une commission
            lorsqu’ils réalisent leur premier achat éligible.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-200">
            {success}
          </div>
        )}

        {ambassador && (
          <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-white/50">
                  Statut de votre candidature
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {getStatusLabel(ambassador.status)}
                </h2>
              </div>

              <span className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold">
                {ambassador.status}
              </span>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/65">
              {getStatusDescription(ambassador)}
            </p>

            {ambassador.status === "ACTIVE" && (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/50">Code de parrainage</p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-xl font-bold">
                        {ambassador.referralCode}
                      </p>

                      <button
                        type="button"
                        onClick={copyReferralCode}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                      >
                        {codeCopied ? "Copié ✓" : "Copier"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/50">Filleuls</p>

                    <p className="mt-2 text-xl font-bold">
                      {ambassador._count?.referrals ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/50">💰 Gains cumulés</p>

                    <p className="mt-2 text-xl font-bold">
                      {formatFcfa(ambassador.totalEarnings)}
                    </p>

                    <p className="mt-2 text-xs text-white/50">
                      Depuis votre inscription.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="mb-5">
                    <h3 className="text-2xl font-black">
                      Situation financière
                    </h3>

                    <p className="mt-2 text-base text-white/55">
                      Suivez vos commissions et vos paiements.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-7">
                      <p className="text-lg font-medium text-yellow-300">
                        🔍 Commissions en vérification
                      </p>

                      <p className="mt-5 text-3xl font-black text-yellow-50">
                        {formatFcfa(ambassador.pendingBalance ?? 0)}
                      </p>

                      <p className="mt-3 text-sm text-yellow-100/65">
                        Commissions reçues, en attente de validation après
                        vérification.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-7">
                      <p className="text-lg font-medium text-green-300">
                        💰 Solde disponible
                      </p>

                      <p className="mt-5 text-3xl font-black text-green-50">
                        {formatFcfa(ambassador.availableBalance ?? 0)}
                      </p>

                      <p className="mt-3 text-sm text-green-100/65">
                        Commissions validées pouvant faire l’objet d’une demande
                        de paiement.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-7">
                      <p className="text-lg font-medium text-orange-300">
                        🔄 Paiement en cours
                      </p>

                      <p className="mt-5 text-3xl font-black text-orange-50">
                        {formatFcfa(ambassador.processingBalance ?? 0)}
                      </p>

                      <p className="mt-3 text-sm text-orange-100/65">
                        Paiement demandé et en attente de traitement par
                        l’administration.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-7">
                      <p className="text-lg font-medium text-blue-300">
                        ✅ Déjà payé
                      </p>

                      <p className="mt-5 text-3xl font-black text-blue-50">
                        {formatFcfa(ambassador.paidBalance ?? 0)}
                      </p>

                      <p className="mt-3 text-sm text-blue-100/65">
                        Total des commissions réellement versées.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-pink-500/30 bg-pink-500/10 p-7">
                      <p className="text-lg font-medium text-pink-300">
                        🪙 Paiement minimum
                      </p>

                      <p className="mt-5 text-3xl font-black text-pink-50">
                        {formatFcfa(ambassador.minimumPayout)}
                      </p>

                      <p className="mt-3 text-sm text-pink-100/65">
                        Montant minimum requis pour recevoir un paiement.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6">
                    <h3 className="text-xl font-bold">
                      Vérification d&apos;identité
                    </h3>

                    {!ambassador.identityVerifiedAt &&
                      !ambassador.identityVerificationRequestedAt && (
                        <>
                          <p className="mt-3 text-sm text-white/60">
                            Avant votre premier paiement, votre identité doit
                            être vérifiée par l&apos;équipe Ubiza.
                          </p>

                          <button
                            type="button"
                            onClick={handleRequestIdentityVerification}
                            disabled={isRequestingVerification}
                            className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 font-bold transition hover:bg-blue-500 disabled:opacity-50"
                          >
                            {isRequestingVerification
                              ? "Envoi..."
                              : "Demander la vérification"}
                          </button>
                        </>
                      )}

                    {ambassador.identityVerificationRequestedAt &&
                      !ambassador.identityVerifiedAt && (
                        <p className="mt-3 text-sm text-yellow-300">
                          🟡 Votre demande de vérification a été envoyée.
                          L&apos;équipe Ubiza vous contactera si nécessaire.
                        </p>
                      )}

                    {ambassador.identityVerifiedAt && (
                      <p className="mt-3 text-sm text-green-300">
                        ✅ Votre identité est vérifiée. Vous pouvez recevoir vos
                        paiements dès que le montant minimum est atteint.
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleRequestPayout}
                      disabled={
                        isRequestingPayout ||
                        !ambassador.identityVerifiedAt ||
                        Number(ambassador.processingBalance ?? 0) > 0 ||
                        Number(ambassador.availableBalance ?? 0) <
                          Number(ambassador.minimumPayout ?? 5000)
                      }
                      className="w-full rounded-2xl bg-green-600 px-6 py-5 text-lg font-black transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-800 disabled:text-white/70"
                    >
                      {isRequestingPayout
                        ? "Demande en cours..."
                        : !ambassador.identityVerifiedAt
                          ? "🪪 Vérification d'identité requise"
                          : Number(ambassador.processingBalance ?? 0) > 0
                            ? "🔄 Paiement en cours de traitement"
                            : Number(ambassador.availableBalance ?? 0) <
                                Number(ambassador.minimumPayout ?? 5000)
                              ? "💰 Minimum non atteint"
                              : "💰 Demander un paiement"}
                    </button>
                  </div>

                  <div className="mt-12">
                    <div className="mb-5">
                      <h3 className="text-2xl font-black">
                        Historique des demandes de paiement
                      </h3>

                      <p className="mt-2 text-base text-white/55">
                        Retrouvez vos paiements effectués ainsi que les demandes
                        refusées.
                      </p>
                    </div>

                    {sortedPayouts.length === 0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/30 px-6 py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
                          🧾
                        </div>

                        <p className="mt-5 text-lg font-bold text-white">
                          Aucun paiement reçu pour le moment.
                        </p>

                        <p className="mt-2 text-sm text-white/50">
                          Vos demandes de paiement apparaîtront ici une fois
                          effectuées.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-3xl border border-white/10">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-white/5 text-white/50">
                              <tr>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">
                                  Montant
                                </th>
                                <th className="px-6 py-4 font-medium">
                                  Statut
                                </th>
                                <th className="px-6 py-4 font-medium">
                                  Référence
                                </th>

                                <th className="px-6 py-4 font-medium">Motif</th>
                              </tr>
                            </thead>

                            <tbody>
                              {visiblePayouts.map((payout) => {
                                const displayDate =
                                  payout.paidAt ??
                                  payout.processedAt ??
                                  payout.requestedAt;

                                return (
                                  <tr
                                    key={payout.id}
                                    className="border-t border-white/10 transition hover:bg-white/[0.03]"
                                  >
                                    <td className="whitespace-nowrap px-6 py-5 text-white/70">
                                      {new Intl.DateTimeFormat("fr-FR", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      }).format(new Date(displayDate))}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-5 font-bold">
                                      {formatFcfa(payout.amount)}
                                    </td>

                                    <td className="whitespace-nowrap px-6 py-5">
                                      {payout.status === "PAID" && "🟢 Payé"}
                                      {payout.status === "FAILED" && "🔴 Échec"}
                                      {payout.status === "CANCELLED" &&
                                        "🔴 Refusé"}
                                    </td>

                                    <td className="px-6 py-5 text-white/60">
                                      {payout.paymentReference || "—"}
                                    </td>

                                    <td className="max-w-xs whitespace-normal px-6 py-5 text-white/60">
                                      {payout.status === "FAILED" ||
                                      payout.status === "CANCELLED"
                                        ? payout.failureReason ||
                                          "Aucun motif communiqué."
                                        : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {visiblePayoutCount < sortedPayouts.length ? (
                          <div className="border-t border-white/10 p-5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setVisiblePayoutCount(
                                  (currentCount) => currentCount + 10,
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                              Afficher plus
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {canApply && (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                {ambassador?.status === "REJECTED"
                  ? "Soumettre une nouvelle candidature"
                  : "Formulaire de candidature"}
              </h2>

              <p className="mt-2 text-sm text-white/50">
                Vérifiez attentivement vos informations avant l’envoi.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Nom complet
                </span>

                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  maxLength={120}
                  required
                  placeholder="Votre nom complet"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-pink-500"
                />
              </label>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Numéro Mobile Money *
                  </span>

                  <input
                    type="tel"
                    value={form.mobileMoneyNumber}
                    onChange={(event) =>
                      updateField("mobileMoneyNumber", event.target.value)
                    }
                    maxLength={30}
                    required
                    placeholder="+237 6XX XX XX XX"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-pink-500"
                  />

                  <p className="mt-2 text-xs leading-5 text-white/50">
                    Ce numéro sera utilisé pour effectuer vos futurs paiements.
                  </p>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <input
                    type="checkbox"
                    checked={sameAsMobileMoney}
                    onChange={(event) =>
                      setSameAsMobileMoney(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-pink-500"
                  />

                  <span className="text-sm leading-6 text-white/65">
                    Ce numéro est également disponible sur WhatsApp.
                  </span>
                </label>

                {!sameAsMobileMoney && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Numéro WhatsApp *
                    </span>

                    <input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={(event) =>
                        updateField("whatsappNumber", event.target.value)
                      }
                      maxLength={30}
                      required
                      placeholder="+237 6XX XX XX XX"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-pink-500"
                    />

                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Ce numéro sera utilisé par l’équipe Ubiza pour vous
                      contacter concernant la vérification de votre identité et
                      le suivi de vos paiements.
                    </p>
                  </label>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Numéro de pièce d’identité
                </span>

                <input
                  type="text"
                  value={form.identityNumber}
                  onChange={(event) =>
                    updateField("identityNumber", event.target.value)
                  }
                  maxLength={50}
                  required
                  placeholder="Numéro CNI ou passeport"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-pink-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Pays</span>

                <input
                  type="text"
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  maxLength={80}
                  required
                  placeholder="Cameroun"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-pink-500"
                />
              </label>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(event) =>
                  updateField("acceptTerms", event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-pink-500"
              />

              <span className="text-sm leading-6 text-white/65">
                J’accepte les conditions du programme ambassadeur et je certifie
                que les informations fournies sont exactes.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-2xl bg-pink-600 px-5 py-4 font-bold transition hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Envoi en cours..."
                : ambassador?.status === "REJECTED"
                  ? "Soumettre de nouveau"
                  : "Envoyer ma candidature"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
