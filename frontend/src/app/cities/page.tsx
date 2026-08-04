import Link from "next/link";

import PopularCities from "@/components/home/PopularCities";
import SiteFooter from "@/components/layout/SiteFooter";

export default function CitiesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-5 pt-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            ← ← Retour à l&apos;accueil
          </Link>

          <h1 className="text-3xl font-black sm:text-4xl">Toutes les villes</h1>
        </div>
      </section>

      <PopularCities limit={0} />

      <SiteFooter />
    </main>
  );
}
