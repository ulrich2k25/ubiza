"use client";

interface PublicProfileHeroProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  city?: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function PublicProfileHero({
  displayName,
  username,
  avatarUrl,
  city,
}: PublicProfileHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">
      {/* Glow background */}
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-fuchsia-500/40 bg-zinc-800 text-5xl font-bold shadow-xl shadow-fuchsia-500/20">
            {avatarUrl ? (
              <img
                src={
                  avatarUrl.startsWith("http")
                    ? avatarUrl
                    : `${API_URL}${avatarUrl}`
                }
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Online */}
          <span className="absolute bottom-3 right-3 flex h-5 w-5 rounded-full border-4 border-black bg-emerald-500" />
        </div>

        {/* Informations */}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {displayName}
            </h1>

            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              ✓ Vérifiée
            </span>
          </div>

          <p className="text-lg text-fuchsia-400">@{username}</p>

          {city ? <p className="text-zinc-400">📍 {city}</p> : null}

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Disponible maintenant
          </div>
        </div>
      </div>

      {/* Stats préparation future */}

      <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
        <div className="rounded-2xl bg-white/5 p-3 text-center">
          <p className="text-xl font-bold text-white">0</p>
          <p className="text-xs text-zinc-400">Vues</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 text-center">
          <p className="text-xl font-bold text-white">0</p>
          <p className="text-xs text-zinc-400">Favoris</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-3 text-center">
          <p className="text-xl font-bold text-white">⭐</p>
          <p className="text-xs text-zinc-400">Premium</p>
        </div>
      </div>
    </section>
  );
}
