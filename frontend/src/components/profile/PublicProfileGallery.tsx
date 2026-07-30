"use client";

import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

interface GalleryImage {
  id: string;
  url: string;
}

interface PublicProfileGalleryProps {
  images: GalleryImage[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

export default function PublicProfileGallery({
  images,
}: PublicProfileGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images.length) {
    return null;
  }

  function getImageUrl(url: string) {
    return url.startsWith("http") ? url : `${API_URL}${url}`;
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Photos</h2>

        <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-zinc-400">
          {images.length} photos
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className={
              index === 0
                ? "group relative overflow-hidden rounded-3xl text-left sm:col-span-2 sm:row-span-2"
                : "group relative overflow-hidden rounded-3xl text-left"
            }
          >
            <img
              src={getImageUrl(image.url)}
              alt="Photo profil"
              className="
                h-full
                min-h-[220px]
                w-full
                cursor-pointer
                object-cover
                transition
                duration-500
                group-hover:scale-105
              "
            />

            {index === 0 && (
              <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur">
                Photo principale
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="
          w-full
          rounded-2xl
          border
          border-white/10
          bg-white/5
          py-4
          font-semibold
          text-white
          transition
          hover:bg-white/10
        "
      >
        Voir toutes les photos
      </button>

      {selectedIndex !== null && (
        <ImageLightbox
          imageUrl={getImageUrl(images[selectedIndex].url)}
          index={selectedIndex}
          total={images.length}
          onClose={() => setSelectedIndex(null)}
          onPrevious={() =>
            setSelectedIndex(
              selectedIndex === 0 ? images.length - 1 : selectedIndex - 1,
            )
          }
          onNext={() =>
            setSelectedIndex(
              selectedIndex === images.length - 1 ? 0 : selectedIndex + 1,
            )
          }
        />
      )}
    </section>
  );
}

