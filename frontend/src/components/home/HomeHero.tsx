"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeHero() {
  const router = useRouter();

  const [query, setQuery] = useState("");

  function handleSearch(value?: string) {
    const searchValue = (value ?? query).trim();

    if (!searchValue) return;

    router.push(`/search?q=${encodeURIComponent(searchValue)}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  return (
    <section
      className="
      relative
      overflow-hidden
      rounded-b-[3rem]
      border-b
      border-white/10
      bg-gradient-to-br
      from-fuchsia-950/40
      via-black
      to-black
      px-6
      py-24
      sm:px-10
      lg:px-20
      "
    >
      <div
        className="
        absolute
        -right-20
        top-10
        h-72
        w-72
        rounded-full
        bg-fuchsia-600/20
        blur-3xl
        "
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <div
          className="
          mx-auto
          mb-6
          w-fit
          rounded-full
          border
          border-fuchsia-500/30
          bg-fuchsia-500/10
          px-4
          py-2
          text-sm
          font-medium
          text-fuchsia-300
          "
        >
          ✨ Découvrez des créatrices vérifiées près de vous
        </div>

        <h1
          className="
          text-4xl
          font-black
          leading-tight
          text-white
          sm:text-6xl
          "
        >
          Trouvez une créatrice
          <br />
          <span className="text-fuchsia-500">qui vous correspond</span>
        </h1>

        <p
          className="
          mx-auto
          mt-6
          max-w-2xl
          text-lg
          leading-8
          text-zinc-400
          "
        >
          Explorez des profils authentiques, découvrez les disponibilités et
          échangez dans un environnement sécurisé.
        </p>

        <div
          className="
          mx-auto
          mt-10
          flex
          max-w-3xl
          flex-col
          gap-3
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-3
          backdrop-blur-xl
          sm:flex-row
          "
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="🔍 Rechercher une ville, un pseudo..."
            className="
            flex-1
            rounded-2xl
            border
            border-white/10
            bg-black/40
            px-5
            py-4
            text-white
            outline-none
            placeholder:text-zinc-500
            focus:border-fuchsia-500
            "
          />

          <button
            onClick={() => handleSearch()}
            className="
            rounded-2xl
            bg-fuchsia-600
            px-8
            py-4
            font-bold
            text-white
            transition
            hover:bg-fuchsia-500
            "
          >
            Rechercher
          </button>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {["Douala", "Yaoundé", "Bafoussam", "Kribi"].map((city) => (
            <button
              key={city}
              onClick={() => handleSearch(city)}
              className="
              rounded-full
              border
              border-white/10
              bg-white/5
              px-5
              py-2
              text-sm
              text-zinc-300
              transition
              hover:border-fuchsia-500
              hover:text-white
              "
            >
              📍 {city}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
