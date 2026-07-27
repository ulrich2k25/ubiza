"use client";

import Link from "next/link";

import type { PublicCreator } from "@/services/public-profile.service";

interface CreatorCardProps {
  creator: PublicCreator;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function CreatorCard({ creator }: CreatorCardProps) {
  const image = creator.listing?.primaryImage;

  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${API_URL}${image}`
    : null;

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 transition-all duration-300 hover:-translate-y-2 hover:border-fuchsia-500/40 hover:shadow-2xl hover:shadow-fuchsia-500/10">
      <div className="relative h-80 overflow-hidden bg-gradient-to-br from-fuchsia-900/40 via-zinc-900 to-black">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={creator.displayName}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-7xl font-black text-white">
            {creator.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />

        {creator.listing?.availableNow ? (
          <span className="absolute bottom-4 left-4 rounded-full border border-emerald-400/20 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 backdrop-blur">
            🟢 Disponible
          </span>
        ) : null}

        <span className="absolute right-4 top-4 rounded-full border border-blue-400/20 bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 backdrop-blur">
          ✓ Vérifiée
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="truncate text-xl font-bold text-white">
            {creator.displayName}
          </h3>

          <p className="mt-1 truncate text-sm text-fuchsia-400">
            @{creator.username}
          </p>

          <p className="mt-2 truncate text-zinc-400">
            📍 {creator.city?.name ?? "Cameroun"}
          </p>
        </div>

        <div className="flex justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-400">
          <span>👁 {creator.listing?.viewCount ?? 0} vues</span>

          <span>
            {creator.listing?.age
              ? `${creator.listing.age} ans`
              : "Âge non renseigné"}
          </span>
        </div>

        <Link
          href={`/${creator.username}`}
          className="block rounded-2xl bg-fuchsia-600 py-3.5 text-center font-bold text-white transition hover:bg-fuchsia-500"
        >
          Voir le profil
        </Link>
      </div>
    </article>
  );
}
