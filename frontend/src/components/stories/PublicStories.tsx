"use client";

import { useEffect, useState } from "react";

import { storyService, type PublicStory } from "@/services/story.service";

interface PublicStoriesProps {
  username: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

function getStoryImageUrl(imageUrl: string): string {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:")
  ) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  return `${API_URL}${normalizedPath}`;
}

export default function PublicStories({ username }: PublicStoriesProps) {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStories() {
      try {
        const result = await storyService.getPublic(username);

        if (isMounted) {
          setStories(result);
        }
      } catch (error) {
        console.error("Impossible de charger les stories publiques.", error);

        if (isMounted) {
          setStories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStories();

    return () => {
      isMounted = false;
    };
  }, [username]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex((currentIndex) => {
          if (currentIndex === null) {
            return null;
          }

          return Math.min(currentIndex + 1, stories.length - 1);
        });
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex((currentIndex) => {
          if (currentIndex === null) {
            return null;
          }

          return Math.max(currentIndex - 1, 0);
        });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedIndex, stories.length]);

  const selectedStory = selectedIndex !== null ? stories[selectedIndex] : null;

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-fuchsia-400">
              Contenu temporaire
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">Stories</h2>
          </div>

          {!isLoading && stories.length > 0 ? (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              {stories.length} active{stories.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
            <div className="text-center">
              <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-400" />

              <p className="mt-3 text-sm text-zinc-400">
                Chargement des stories...
              </p>
            </div>
          </div>
        ) : stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-fuchsia-300">
              <StoryIcon />
            </div>

            <p className="mt-4 font-semibold text-white">
              Aucune story pour le moment
            </p>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
              Ce profil n’a actuellement aucune story active.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-2">
            {stories.map((story, index) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className="relative h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-pink-500 p-[2px] transition hover:scale-105"
                aria-label={`Ouvrir la story ${index + 1}`}
              >
                <span className="relative block h-full w-full overflow-hidden rounded-full border-2 border-zinc-950 bg-zinc-900">
                  <img
                    src={getStoryImageUrl(story.imageUrl)}
                    alt={`Story de ${username}`}
                    className="h-full w-full object-cover"
                  />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedStory ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Story de ${username}`}
        >
          <div className="absolute left-4 right-4 top-4 flex gap-1">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className={`h-full bg-white ${
                    selectedIndex !== null && index <= selectedIndex
                      ? "w-full"
                      : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-5 top-12 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label="Fermer la story"
          >
            ×
          </button>

          {selectedIndex !== null && selectedIndex > 0 ? (
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((currentIndex) =>
                  currentIndex === null ? null : Math.max(currentIndex - 1, 0),
                )
              }
              className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
              aria-label="Story précédente"
            >
              ‹
            </button>
          ) : null}

          <div className="flex h-[80vh] w-full max-w-md items-center justify-center overflow-hidden rounded-3xl bg-zinc-950">
            <img
              src={getStoryImageUrl(selectedStory.imageUrl)}
              alt={`Story de ${username}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {selectedIndex !== null && selectedIndex < stories.length - 1 ? (
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((currentIndex) =>
                  currentIndex === null
                    ? null
                    : Math.min(currentIndex + 1, stories.length - 1),
                )
              }
              className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-3xl text-white transition hover:bg-white/20"
              aria-label="Story suivante"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function StoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8 16 3.2-3.2a1.5 1.5 0 0 1 2.1 0L16 15.5"
      />

      <circle cx="15.5" cy="8.5" r="1.5" />
    </svg>
  );
}

