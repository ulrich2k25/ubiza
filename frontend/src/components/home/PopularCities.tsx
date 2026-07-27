"use client";

import { useRouter } from "next/navigation";

const cities = [
  {
    name: "Douala",
    creators: "120+ créatrices",
    emoji: "🌆",
  },
  {
    name: "Yaoundé",
    creators: "90+ créatrices",
    emoji: "🏙️",
  },
  {
    name: "Bafoussam",
    creators: "40+ créatrices",
    emoji: "🌄",
  },
  {
    name: "Kribi",
    creators: "30+ créatrices",
    emoji: "🌊",
  },
];

export default function PopularCities() {
  const router = useRouter();

  function searchCity(city: string) {
    router.push(`/search?q=${encodeURIComponent(city)}`);
  }

  return (
    <section id="cities" className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-fuchsia-400">
          Explorer par ville
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          Trouvez des créatrices près de vous
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cities.map((city) => (
          <button
            key={city.name}
            onClick={() => searchCity(city.name)}
            className="
              group
              rounded-3xl
              border
              border-white/10
              bg-white/[0.03]
              p-6
              text-left
              transition
              hover:-translate-y-1
              hover:border-fuchsia-500/40
              hover:bg-white/[0.06]
            "
          >
            <div className="text-4xl">{city.emoji}</div>

            <h3 className="mt-5 text-xl font-bold text-white">{city.name}</h3>

            <p className="mt-2 text-sm text-zinc-400">{city.creators}</p>

            <div className="mt-5 text-sm font-medium text-fuchsia-400">
              Découvrir →
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
