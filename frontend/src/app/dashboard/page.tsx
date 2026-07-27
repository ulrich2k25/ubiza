"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProfileContactForm from "@/components/profile/ProfileContactForm";
import StoriesManager from "@/components/stories/StoriesManager";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardData, dashboardService } from "@/services/dashboard.service";
import type { ProfileContact } from "@/services/profile.service";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const { logout } = useAuth();

  useEffect(() => {
    dashboardService
      .getDashboard()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleContactSaved(contact: ProfileContact) {
    setData((currentData) => {
      if (!currentData || !currentData.profile) {
        return currentData;
      }

      return {
        ...currentData,
        profile: {
          ...currentData.profile,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          telegram: contact.telegram,
        },
      };
    });
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
          {error || "Impossible de charger le dashboard."}
        </div>
      </main>
    );
  }

  const name = data.profile?.displayName || "Créatrice Ubiza";

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const initialContact: ProfileContact = {
    phone: data.profile?.phone ?? null,
    whatsapp: data.profile?.whatsapp ?? null,
    telegram: data.profile?.telegram ?? null,
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-fuchsia-400">
              Espace créatrice
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Bonjour, {name}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Gérez votre profil et votre annonce depuis un seul endroit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href="/#creators"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Voir les annonces
              </Link>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-500"
              >
                Déconnexion
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 font-bold">
                {initials}
              </div>

              <div>
                <p className="font-semibold">{name}</p>

                <p className="text-sm text-zinc-400">{data.user.email}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Vues" value={data.stats.views} />
          <StatCard label="Favoris" value={data.stats.favorites} />
          <StatCard label="Avis" value={data.stats.reviews} />
          <StatCard label="Trust Score" value={`${data.user.trustScore}/100`} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Profil public</p>

                <h2 className="mt-1 text-xl font-semibold">{name}</h2>
              </div>

              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {data.user.trustLevel}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <InfoRow
                label="Ville"
                value={data.profile?.city?.name || "Non renseignée"}
              />

              <InfoRow
                label="Langue"
                value={data.profile?.language?.name || "Non renseignée"}
              />

              <InfoRow label="Statut du compte" value={data.user.status} />

              <InfoRow
                label="Qualité du profil"
                value={
                  data.profile?.profileQualityScore !== null &&
                  data.profile?.profileQualityScore !== undefined
                    ? `${data.profile.profileQualityScore}/100`
                    : "Non calculée"
                }
              />

              <InfoRow
                label="Téléphone"
                value={data.profile?.phone || "Non renseigné"}
              />

              <InfoRow
                label="WhatsApp"
                value={data.profile?.whatsapp || "Non renseigné"}
              />

              <InfoRow
                label="Telegram"
                value={data.profile?.telegram || "Non renseigné"}
              />
            </div>

            {isEditingProfile ? (
              <ProfileContactForm
                initialContact={initialContact}
                onCancel={() => setIsEditingProfile(false)}
                onSaved={handleContactSaved}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium transition hover:bg-white/10"
              >
                Modifier mes coordonnées
              </button>
            )}
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">Mon annonce</p>

                <h2 className="mt-1 text-xl font-semibold">
                  {data.listing?.title || "Aucune annonce"}
                </h2>
              </div>

              {data.listing && (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {data.listing.status}
                </span>
              )}
            </div>

            {data.listing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Ville" value={data.listing.city.name} />

                  <InfoRow
                    label="Catégorie"
                    value={data.listing.category.name}
                  />

                  <InfoRow
                    label="Disponible maintenant"
                    value={data.listing.availableNow ? "Oui" : "Non"}
                  />

                  <InfoRow label="Images" value={data.listing.images.length} />
                </div>

                <p className="mt-6 line-clamp-4 text-sm leading-6 text-zinc-400">
                  {data.listing.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/listing"
                    className="rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Modifier l’annonce
                  </Link>

                  <Link
                    href="/dashboard/listing"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium transition hover:bg-white/10"
                  >
                    Gérer les images
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center">
                <p className="font-semibold">Vous n’avez aucune annonce.</p>

                <p className="mt-2 text-sm text-zinc-400">
                  Créez votre annonce pour commencer à apparaître sur Ubiza.
                </p>

                <Link
                  href="/dashboard/listing"
                  className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-3 font-semibold transition hover:opacity-90"
                >
                  Créer mon annonce
                </Link>
              </div>
            )}
          </article>
        </section>

        <StoriesManager />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className="mt-3 text-3xl font-bold">{value}</p>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
      <span className="text-zinc-400">{label}</span>

      <span className="break-all text-right font-medium">{value}</span>
    </div>
  );
}
