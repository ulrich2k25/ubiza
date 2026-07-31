import Link from "next/link";

import type { DashboardData } from "@/services/dashboard.service";
import type { BoostStatus } from "@/services/boost.service";

interface VisibilityScoreCardProps {
  data: DashboardData;
  boost: BoostStatus | null;
}

interface VisibilityRecommendation {
  id: string;
  label: string;
  points: number;
  completed: boolean;
  icon: string;
  actionLabel: string;
  actionHref?: string;
  helperText?: string;
}

export default function VisibilityScoreCard({
  data,
  boost,
}: VisibilityScoreCardProps) {
  const recommendations = buildRecommendations(data, boost);

  const score = recommendations.reduce(
    (total, recommendation) =>
      total + (recommendation.completed ? recommendation.points : 0),
    0,
  );

  const completedActions = recommendations.filter(
    (recommendation) => recommendation.completed,
  ).length;

  const nextActions = recommendations
    .filter((recommendation) => !recommendation.completed)
    .slice(0, 3);

  const level = getVisibilityLevel(score);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        {/* Score */}
        <div className="border-b border-white/10 p-6 lg:border-r lg:border-b-0">
          <p className="text-sm font-medium text-fuchsia-400">
            Performance du profil
          </p>

          <div className="mt-3 flex items-start justify-between gap-5">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Score de visibilité
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Les éléments essentiels pour renforcer ta visibilité.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-4xl font-black tracking-tight text-white">
                {score}
                <span className="ml-1 text-base font-semibold text-zinc-500">
                  /100
                </span>
              </p>

              <p className="mt-1 text-sm font-semibold text-fuchsia-300">
                {level.label}
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500"
              style={{
                width: `${score}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {completedActions} critère
              {completedActions > 1 ? "s" : ""} sur {recommendations.length}
            </p>

            <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-300">
              {level.label}
            </span>
          </div>

          <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/20 px-4">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-lg">{recommendation.icon}</span>

                  <p
                    className={`truncate text-sm font-semibold ${
                      recommendation.completed ? "text-white" : "text-zinc-400"
                    }`}
                  >
                    {recommendation.label}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {!recommendation.completed && (
                    <span className="text-xs font-semibold text-fuchsia-300">
                      +{recommendation.points}
                    </span>
                  )}

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      recommendation.completed
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-white/5 text-zinc-600"
                    }`}
                  >
                    {recommendation.completed ? "✓" : "○"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions recommandées */}
        <div className="p-6">
          <p className="text-sm font-medium text-fuchsia-400">
            Actions recommandées
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Améliore ta visibilité
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Complète les éléments manquants pour atteindre 100 points.
              </p>
            </div>

            {score === 100 && (
              <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Profil optimisé
              </span>
            )}
          </div>

          {nextActions.length > 0 ? (
            <div className="mt-6 space-y-3">
              {nextActions.map((action) => (
                <article
                  key={action.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-xl">
                    {action.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-white">{action.label}</p>

                      <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-xs font-bold text-fuchsia-300">
                        +{action.points}
                      </span>
                    </div>

                    {action.helperText && (
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        {action.helperText}
                      </p>
                    )}

                    {action.actionHref ? (
                      <Link
                        href={action.actionHref}
                        className="mt-2 inline-flex text-sm font-semibold text-fuchsia-300 transition hover:text-fuchsia-200"
                      >
                        {action.actionLabel} →
                      </Link>
                    ) : (
                      <p className="mt-2 text-sm font-semibold text-zinc-500">
                        {action.actionLabel}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
              <span className="text-4xl">🏆</span>

              <p className="mt-3 text-lg font-bold text-emerald-300">
                Ton profil est entièrement optimisé
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Tous les critères de visibilité sont remplis.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildRecommendations(
  data: DashboardData,
  boost: BoostStatus | null,
): VisibilityRecommendation[] {
  const listing = data.listing;
  const profile = data.profile;

  const imageCount = listing?.images.length ?? 0;

  const hasPhoneOrWhatsapp = Boolean(profile?.phone || profile?.whatsapp);

  return [
    {
      id: "photos",
      label: "Au moins 3 photos",
      points: 25,
      completed: imageCount >= 3,
      icon: "🖼️",
      actionLabel: "Ajouter des photos",
      actionHref: "/dashboard/listing",
    },
    {
      id: "contact",
      label: "Téléphone ou WhatsApp",
      points: 25,
      completed: hasPhoneOrWhatsapp,
      icon: "☎️",
      actionLabel: "Ajouter un contact",
      actionHref: "/dashboard#contact",
    },
    {
      id: "verified",
      label: "Profil vérifié",
      points: 25,
      completed: profile?.isVerified === true,
      icon: "✅",
      actionLabel: "Attribution automatique",
      helperText: "Annonce publiée · contact ajouté · adresse e-mail vérifiée",
    },
    {
      id: "boost",
      label: "Boost actif",
      points: 25,
      completed: boost?.isBoostActive === true,
      icon: "🚀",
      actionLabel: "Acheter un Boost",
      actionHref: "/dashboard?openBoost=1#boost",
      helperText: "Mets ton annonce en avant pendant 1 heure.",
    },
  ];
}

function getVisibilityLevel(score: number) {
  if (score === 100) {
    return {
      label: "Excellent",
    };
  }

  if (score >= 75) {
    return {
      label: "Très bon",
    };
  }

  if (score >= 50) {
    return {
      label: "Bon",
    };
  }

  if (score >= 25) {
    return {
      label: "À améliorer",
    };
  }

  return {
    label: "Incomplet",
  };
}
