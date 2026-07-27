"use client";

import type { PublicCreator } from "@/services/public-profile.service";
import CreatorGrid from "@/components/creators/CreatorGrid";

interface FeaturedCreatorsProps {
  creators: PublicCreator[];
}

export default function FeaturedCreators({ creators }: FeaturedCreatorsProps) {
  if (!creators.length) {
    return null;
  }

  return (
    <section id="creators" className="mx-auto max-w-7xl px-5 py-16">
      <div className="mb-8">
        <p className="text-sm font-medium text-fuchsia-400">
          Créatrices populaires
        </p>

        <h2 className="mt-2 text-3xl font-black text-white">
          Découvrez les profils du moment
        </h2>
      </div>

      <CreatorGrid creators={creators} />
    </section>
  );
}
