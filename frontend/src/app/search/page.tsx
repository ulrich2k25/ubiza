import Link from "next/link";

import { api } from "@/services/api";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

interface SearchCreator {
  username: string;
  displayName: string;
  city: {
    id: string;
    name: string;
  } | null;

  listing: {
    age: number;
    availableNow: boolean;
    primaryImage: string | null;
  } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  let creators: SearchCreator[] = [];

  if (q) {
    creators = await api(`/profiles/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <main className="min-h-screen bg-black px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black">
          Résultats pour :<span className="ml-2 text-fuchsia-500">{q}</span>
        </h1>

        {creators.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">
            Aucun profil trouvé.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <article
                key={creator.username}
                className="
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-zinc-950
                "
              >
                <div className="h-72 bg-zinc-900">
                  {creator.listing?.primaryImage ? (
                    <img
                      src={
                        creator.listing.primaryImage.startsWith("http")
                          ? creator.listing.primaryImage
                          : `${API_URL}${creator.listing.primaryImage}`
                      }
                      alt={creator.displayName}
                      className="
                      h-full
                      w-full
                      object-cover
                      "
                    />
                  ) : null}
                </div>

                <div className="space-y-3 p-5">
                  <h2 className="text-xl font-bold">{creator.displayName}</h2>

                  <p className="text-zinc-400">
                    📍 {creator.city?.name ?? "Cameroun"}
                  </p>

                  {creator.listing?.availableNow && (
                    <p className="text-emerald-400">🟢 Disponible</p>
                  )}

                  <Link
                    href={`/${creator.username}`}
                    className="
                    block
                    rounded-xl
                    bg-fuchsia-600
                    py-3
                    text-center
                    font-semibold
                    hover:bg-fuchsia-500
                    "
                  >
                    Voir le profil
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
