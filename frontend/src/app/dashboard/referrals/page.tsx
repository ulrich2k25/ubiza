"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  referralService,
  type ReferralDashboard,
} from "@/services/referral.service";

import {
  ambassadorService,
  type AmbassadorMeResponse,
} from "@/services/ambassador.service";

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralDashboard | null>(null);
  const [ambassadorData, setAmbassadorData] =
    useState<AmbassadorMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadReferralData(showLoading = true): Promise<void> {
      if (showLoading) {
        setLoading(true);
        setError("");
      }

      try {
        const [referralDashboard, ambassadorResponse] = await Promise.all([
          referralService.getMine(),
          ambassadorService.getMine(),
        ]);

        if (!isCancelled) {
          setData(referralDashboard);
          setAmbassadorData(ambassadorResponse);
        }
      } catch (loadError) {
        if (showLoading && !isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de charger votre parrainage.",
          );
        }
      } finally {
        if (showLoading && !isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadReferralData();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadReferralData(false);
      }
    }, 10_000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  async function copyValue(
    value: string,
    type: "code" | "link",
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(type);

      window.setTimeout(() => {
        setCopiedValue(null);
      }, 2000);
    } catch {
      setError("Impossible de copier le contenu.");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <p className="text-sm text-zinc-400">
          Chargement du programme de parrainage...
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="max-w-lg rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-center text-red-200">
          {error || "Impossible de charger le programme de parrainage."}
        </div>
      </main>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${encodeURIComponent(
    data.referralCode,
  )}`;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-fuchsia-400">
              Programme Ubiza
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Parrainage
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Invitez de nouveaux profils sur Ubiza. Lorsqu&apos;un profil
              parrainé publie sa première annonce, vous recevez automatiquement
              un crédit Boost.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Retour au dashboard
          </Link>
        </header>

        <MoneySection ambassadorData={ambassadorData} />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Crédits Boost"
            value={data.boostCredits}
            description="Disponibles sur votre compte"
          />

          <StatCard
            label="Filleules inscrites"
            value={data.totalReferrals}
            description="Inscriptions avec votre lien"
          />

          <StatCard
            label="Récompensées"
            value={data.rewardedReferrals}
            description="Première annonce publiée"
          />

          <StatCard
            label="En attente"
            value={data.pendingReferrals}
            description="Pas encore de première publication"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-zinc-400">Votre code de parrainage</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center rounded-xl border border-white/10 bg-black/30 px-4 font-mono font-semibold tracking-wide text-zinc-100">
                {data.referralCode}
              </div>

              <button
                type="button"
                onClick={() => copyValue(data.referralCode, "code")}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                {copiedValue === "code" ? "Copié" : "Copier"}
              </button>
            </div>
          </article>

          <article className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-zinc-400">Votre lien de partage</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-300">
                <span className="truncate">{referralLink}</span>
              </div>

              <button
                type="button"
                onClick={() => copyValue(referralLink, "link")}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold transition hover:opacity-90"
              >
                {copiedValue === "link" ? "Copié" : "Copier"}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6">
            <p className="text-sm text-zinc-400">Votre réseau</p>

            <h2 className="mt-1 text-xl font-semibold">Filleules parrainées</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Le statut passe à « Boost accordé » après la première publication
              de l&apos;annonce.
            </p>
          </div>

          {data.referrals.length > 0 ? (
            <div className="space-y-3">
              {data.referrals.map((referral) => {
                const isRewarded = referral.rewardGranted;

                return (
                  <article
                    key={referral.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {referral.displayName ||
                          referral.username ||
                          "Profil Ubiza"}
                      </p>

                      {referral.username && (
                        <p className="mt-1 truncate text-sm text-zinc-400">
                          @{referral.username}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-zinc-500">
                        Inscrite le {formatDate(referral.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <ReferralStatusBadge rewarded={isRewarded} />

                      {isRewarded && referral.rewardGrantedAt ? (
                        <p className="text-xs text-zinc-500">
                          Boost accordé le{" "}
                          {formatDate(referral.rewardGrantedAt)}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          Première publication attendue
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center">
              <p className="font-semibold">
                Vous n&apos;avez encore parrainé personne.
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Copiez votre lien et partagez-le avec une personne intéressée
                par Ubiza.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 p-6">
          <p className="text-sm font-medium text-fuchsia-300">
            Comment gagner un Boost ?
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <StepCard
              number="1"
              title="Partagez votre lien"
              description="Envoyez votre lien personnel à un nouveau profil."
            />

            <StepCard
              number="2"
              title="Elle crée son compte"
              description="Son inscription est automatiquement associée à votre compte."
            />

            <StepCard
              number="3"
              title="Elle publie"
              description="À sa première annonce publiée, vous recevez automatiquement 1 Boost."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function MoneySection({
  ambassadorData,
}: {
  ambassadorData: AmbassadorMeResponse | null;
}) {
  const ambassador = ambassadorData?.ambassador;

  if (!ambassadorData?.hasApplied || !ambassador) {
    return (
      <section className="mb-6 overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/15 via-violet-600/10 to-transparent p-6 sm:p-8">
        <p className="text-sm font-semibold text-fuchsia-300">
          Gagner de l&apos;argent
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Gagnez de l&apos;argent avec Ubiza
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
          Recommandez Ubiza à de nouveaux profils et recevez des commissions
          lorsqu&apos;elles effectuent leur premier achat éligible.
        </p>

        <Link
          href="/dashboard/ambassador"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold transition hover:opacity-90"
        >
          Commencer maintenant
        </Link>
      </section>
    );
  }

  if (ambassador.status === "PENDING") {
    return (
      <AmbassadorStatusCard
        title="Candidature en cours d’examen"
        description="Votre demande a bien été reçue. L’équipe Ubiza doit maintenant la vérifier."
        badge="En attente"
        badgeClasses="border-amber-400/20 bg-amber-400/10 text-amber-300"
      />
    );
  }

  if (ambassador.status === "REJECTED") {
    return (
      <AmbassadorStatusCard
        title="Votre candidature doit être corrigée"
        description={
          ambassador.rejectionReason ||
          "Consultez votre dossier et soumettez une nouvelle candidature."
        }
        badge="Refusée"
        badgeClasses="border-red-400/20 bg-red-400/10 text-red-300"
        actionLabel="Modifier ma candidature"
      />
    );
  }

  if (ambassador.status === "SUSPENDED") {
    return (
      <AmbassadorStatusCard
        title="Espace ambassadeur suspendu"
        description="Votre activité ambassadeur est temporairement suspendue."
        badge="Suspendu"
        badgeClasses="border-orange-400/20 bg-orange-400/10 text-orange-300"
        actionLabel="Consulter mon espace"
      />
    );
  }

  return (
    <section className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.07] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            Programme de commissions
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Votre espace ambassadeur est actif
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Consultez vos filleuls, vos commissions et votre code de parrainage.
          </p>
        </div>

        <Link
          href="/dashboard/ambassador"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
        >
          Ouvrir mon espace
        </Link>
      </div>
    </section>
  );
}

function AmbassadorStatusCard({
  title,
  description,
  badge,
  badgeClasses,
  actionLabel,
}: {
  title: string;
  description: string;
  badge: string;
  badgeClasses: string;
  actionLabel?: string;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}
          >
            {badge}
          </span>

          <h2 className="mt-4 text-2xl font-bold">{title}</h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>

        {actionLabel && (
          <Link
            href="/dashboard/ambassador"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-semibold transition hover:bg-white/15"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className="mt-3 text-3xl font-bold">{value}</p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
      )}
    </article>
  );
}

function ReferralStatusBadge({ rewarded }: { rewarded: boolean }) {
  if (rewarded) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
        +1 Boost accordé
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
      En attente
    </span>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
        {number}
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </article>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
