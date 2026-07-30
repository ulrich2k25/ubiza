"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  referralService,
  type ReferralDashboard,
} from "@/services/referral.service";

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedValue, setCopiedValue] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    referralService
      .getMine()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function copyValue(
    value: string,
    type: "code" | "link",
  ): Promise<void> {
    await navigator.clipboard.writeText(value);
    setCopiedValue(type);

    window.setTimeout(() => {
      setCopiedValue(null);
    }, 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Chargement...
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-red-200">
          {error || "Impossible de charger le programme de parrainage."}
        </div>
      </main>
    );
  }

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${data.referralCode}`
      : `/register?ref=${data.referralCode}`;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-fuchsia-400">
              Programme Ubiza
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Parrainage
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Invitez d&apos;autres crÃ©atrices sur Ubiza et gagnez des crÃ©dits
              Boost.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Retour au dashboard
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="CrÃ©dits Boost" value={data.boostCredits} />
          <StatCard label="CrÃ©atrices parrainÃ©es" value={data.totalReferrals} />
          <StatCard
            label="RÃ©compense"
            value="Boost"
            description="Activation manuelle"
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-zinc-400">Votre code de parrainage</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center rounded-xl border border-white/10 bg-black/30 px-4 font-mono font-semibold tracking-wide">
                {data.referralCode}
              </div>

              <button
                type="button"
                onClick={() => copyValue(data.referralCode, "code")}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                {copiedValue === "code" ? "CopiÃ©" : "Copier"}
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-zinc-400">Votre lien de partage</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center overflow-hidden rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-zinc-300">
                <span className="truncate">{referralLink}</span>
              </div>

              <button
                type="button"
                onClick={() => copyValue(referralLink, "link")}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold transition hover:opacity-90"
              >
                {copiedValue === "link" ? "CopiÃ©" : "Copier"}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6">
            <p className="text-sm text-zinc-400">Votre rÃ©seau</p>

            <h2 className="mt-1 text-xl font-semibold">
              CrÃ©atrices parrainÃ©es
            </h2>
          </div>

          {data.referrals.length > 0 ? (
            <div className="space-y-3">
              {data.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {referral.displayName ||
                        referral.username ||
                        "CrÃ©atrice Ubiza"}
                    </p>

                    {referral.username && (
                      <p className="mt-1 text-sm text-zinc-400">
                        @{referral.username}
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-zinc-500">
                    Inscrite le{" "}
                    {new Date(referral.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center">
              <p className="font-semibold">
                Vous n&apos;avez encore parrainÃ© personne.
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Copiez votre lien et partagez-le avec une crÃ©atrice intÃ©ressÃ©e
                par Ubiza.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
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
        <p className="mt-2 text-xs text-zinc-500">{description}</p>
      )}
    </article>
  );
}

