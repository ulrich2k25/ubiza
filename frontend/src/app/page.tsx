import Link from "next/link";

import HomeNavbar from "@/components/home/HomeNavbar";
import HomeHero from "@/components/home/HomeHero";
import HomeStories from "@/components/home/HomeStories";
import FeaturedCreators from "@/components/home/FeaturedCreators";
import PopularCities from "@/components/home/PopularCities";

import { publicProfileService } from "@/services/public-profile.service";
import { storyService } from "@/services/story.service";

export default async function Home() {
  const [creators, stories] = await Promise.all([
    publicProfileService.getPublicProfiles(),
    storyService.getPublicStories(),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      <HomeNavbar />

      <HomeHero />

      <HomeStories stories={stories} />

      <FeaturedCreators creators={creators} />

      <PopularCities />

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-zinc-950 to-black p-8 text-center sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400">
            Rejoignez la communauté
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Rejoins Ubiza aujourd&apos;hui
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Découvre des profils, crée ton compte et profite d&apos;une
            expérience simple et sécurisée.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex rounded-2xl bg-fuchsia-600 px-8 py-4 font-bold text-white transition hover:bg-fuchsia-500"
          >
            Créer un compte gratuitement
          </Link>
        </div>
      </section>
    </main>
  );
}
