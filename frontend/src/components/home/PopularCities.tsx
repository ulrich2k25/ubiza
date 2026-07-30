"use client";

import { useEffect, useState } from "react";
import { MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { cityService, type City } from "@/services/city.service";

interface PopularCitiesProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function PopularCities({
  limit = 4,
  showViewAll = false,
}: PopularCitiesProps) {
  const router = useRouter();

  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCities() {
      try {
        const data = await cityService.getAll();

        const sortedCities = [...data].sort(
          (a, b) => b.profileCount - a.profileCount,
        );

        setCities(limit > 0 ? sortedCities.slice(0, limit) : sortedCities);
      } catch (error) {
        console.error("Erreur lors du chargement des villes :", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCities();
  }, [limit]);

  function searchCity(cityName: string) {
    router.push(`/search?q=${encodeURIComponent(cityName)}`);
  }

  function formatProfileCount(count: number) {
    if (count === 0) {
      return "Aucun profil";
    }

    return `${count} profil${count > 1 ? "s" : ""}`;
  }

  return (
    <section id="cities" className="mx-auto max-w-7xl px-5 py-20">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-400">
          <MapPin className="h-4 w-4" />
          Explorer par ville
        </div>

        <h2 className="mt-3 max-w-2xl text-3xl font-black text-white sm:text-4xl">
          Trouvez des profils près de vous
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
          Découvrez les villes les plus actives sur Ubiza.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="min-h-[280px] animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : cities.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
          Aucune ville disponible pour le moment.
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => searchCity(city.name)}
                className="
                  group
                  flex
                  min-h-[280px]
                  flex-col
                  rounded-3xl
                  border
                  border-white/10
                  bg-gradient-to-b
                  from-white/[0.06]
                  to-white/[0.02]
                  p-6
                  text-left
                  transition
                  duration-300
                  hover:-translate-y-1.5
                  hover:border-fuchsia-500/50
                  hover:shadow-[0_20px_60px_rgba(192,38,211,0.12)]
                "
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 transition duration-300 group-hover:scale-105 group-hover:border-fuchsia-400/50 group-hover:bg-fuchsia-500/15">
                  <MapPin className="h-8 w-8 text-fuchsia-400" />
                </div>

                <div className="mt-7">
                  <h3 className="text-2xl font-black text-white">
                    {city.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                    <Users className="h-4 w-4 text-fuchsia-400" />
                    <span>{formatProfileCount(city.profileCount)}</span>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-fuchsia-400 transition group-hover:border-fuchsia-500/30 group-hover:bg-fuchsia-500/10">
                    <span>Découvrir</span>

                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {showViewAll ? (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => router.push("/cities")}
                className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-8 py-4 font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/20 hover:text-white"
              >
                Voir toutes les villes →
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
