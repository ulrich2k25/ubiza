"use client";

import Link from "next/link";

import type { PublicCreator } from "@/services/public-profile.service";

interface BoostedCreatorsProps {
  creators: PublicCreator[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function BoostedCreators({ creators }: BoostedCreatorsProps) {
  const boostedCreators = creators.filter(
    (creator) => creator.listing?.isBoosted === true,
  );

  if (boostedCreators.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/70 via-zinc-950 to-black p-6 shadow-2xl shadow-fuchsia-950/30 sm:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">
              <span>ðŸš€</span>
              Profils mis en avant
            </div>

            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
              Les profils Ã  la une
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              DÃ©couvre les crÃ©atrices actuellement mises en avant sur Ubiza.
            </p>
          </div>

          <Link
            href="/#creators"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-fuchsia-400/30 hover:bg-fuchsia-500/10 hover:text-white"
          >
            Voir tous les profils â†’
          </Link>
        </div>

        <div className="relative flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3">
          {boostedCreators.map((creator) => {
            const image = creator.listing?.primaryImage;

            const imageUrl = image
              ? image.startsWith("http")
                ? image
                : `${API_URL}${image}`
              : null;

            return (
              <Link
                key={creator.username}
                href={`/${creator.username}`}
                className="group min-w-[240px] snap-start sm:min-w-[275px]"
              >
                <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-2xl hover:shadow-fuchsia-500/10">
                  <div className="relative h-80 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={creator.displayName}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-fuchsia-900 via-zinc-900 to-black text-7xl font-black text-white">
                        {creator.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-100 backdrop-blur-xl">
                      ðŸš€ Boost
                    </div>

                    {creator.listing?.availableNow ? (
                      <div className="absolute right-4 top-4 rounded-full border border-emerald-300/20 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 backdrop-blur-xl">
                        ðŸŸ¢ Disponible
                      </div>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="truncate text-2xl font-black text-white">
                        {creator.displayName}
                      </h3>

                      <p className="mt-1 truncate text-sm font-medium text-fuchsia-300">
                        @{creator.username}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-300">
                        <span className="truncate">
                          ðŸ“ {creator.city?.name ?? "Cameroun"}
                        </span>

                        {creator.listing?.age ? (
                          <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs backdrop-blur">
                            {creator.listing.age} ans
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                    <span className="text-sm text-zinc-400">
                      ðŸ‘ {creator.listing?.viewCount ?? 0} vues
                    </span>

                    <span className="text-sm font-bold text-fuchsia-300 transition group-hover:text-fuchsia-200">
                      Voir le profil â†’
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

