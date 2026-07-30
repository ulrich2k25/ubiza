import Link from "next/link";
import { notFound } from "next/navigation";

import CreatorGrid from "@/components/creators/CreatorGrid";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import SiteFooter from "@/components/layout/SiteFooter";
import PublicProfileContact from "@/components/profile/PublicProfileContact";
import PublicProfileGallery from "@/components/profile/PublicProfileGallery";
import PublicProfileHero from "@/components/profile/PublicProfileHero";
import PublicStories from "@/components/stories/PublicStories";

import type { PublicCreator } from "@/services/public-profile.service";
import {
  getPublicProfile,
  getSuggestions,
  type PublicProfile,
} from "@/services/profile.service";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  let profile: PublicProfile;

  try {
    profile = await getPublicProfile(username);
  } catch {
    notFound();
  }

  const listing = profile.listings?.[0];

  const isBoosted = profile.isBoosted || listing?.isBoosted || false;

  let suggestions: PublicCreator[] = [];

  try {
    suggestions = await getSuggestions(username);
  } catch {
    suggestions = [];
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/#creators"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <span aria-hidden="true">←</span>
            Retour aux annonces
          </Link>

          <Link
            href="/"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Accueil
          </Link>
        </div>

        {/* PROFIL */}
        <PublicProfileHero
          displayName={profile.displayName}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          city={profile.city?.name}
          isVerified={profile.isVerified}
          viewCount={listing?.viewCount ?? 0}
          favoriteCount={listing?.favoriteCount ?? 0}
          createdAt={profile.createdAt}
        />

        {/* STATUTS DU PROFIL */}
        {(isBoosted || profile.isPremium || profile.isVerified) && (
          <div className="flex flex-wrap items-center gap-3">
            {isBoosted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/20 px-4 py-2 text-sm font-bold text-fuchsia-200 backdrop-blur">
                🚀 Boost
              </span>
            ) : null}

            {profile.isPremium ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/20 px-4 py-2 text-sm font-bold text-amber-200 backdrop-blur">
                ⭐ Premium
              </span>
            ) : null}

            {profile.isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-300 backdrop-blur">
                ✓ Vérifiée
              </span>
            ) : null}
          </div>
        )}

        <PublicStories username={profile.username} />

        {/* ANNONCE + GALERIE */}
        {listing ? (
          <>
            <section className="space-y-6 rounded-3xl border border-white/10 bg-zinc-950 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{listing.title}</h1>

                  {listing.availableNow ? (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                      🟢 Disponible maintenant
                    </span>
                  ) : null}
                </div>

                {listing.description ? (
                  <p className="mt-3 whitespace-pre-line leading-7 text-zinc-400">
                    {listing.description}
                  </p>
                ) : null}

                {listing.age ? (
                  <p className="mt-3 text-sm text-zinc-500">
                    Âge : {listing.age} ans
                  </p>
                ) : null}
              </div>

              {listing.images?.length > 0 ? (
                <PublicProfileGallery images={listing.images} />
              ) : null}
            </section>

            {/* FAVORI */}
            <div className="flex justify-end">
              <FavoriteButton
                listingId={listing.id}
                username={profile.username}
              />
            </div>

            {/* CONTACT */}
            <PublicProfileContact
              username={profile.username}
              displayName={profile.displayName}
            />
          </>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
            Ce profil n&apos;a pas encore publié d&apos;annonce.
          </section>
        )}

        {/* SUGGESTIONS */}
        {suggestions.length > 0 ? (
          <section className="border-t border-white/10 pt-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fuchsia-400">
                  À découvrir
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Autres profils qui pourraient vous intéresser
                </h2>
              </div>

              <Link
                href="/#creators"
                className="text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                Voir toutes les annonces →
              </Link>
            </div>

            <CreatorGrid creators={suggestions} columns={4} />
          </section>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}
