"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  type HomeStory,
  type PublicStory,
  storyService,
} from "@/services/story.service";

interface HomeStoriesProps {
  stories: HomeStory[];
}

const STORY_DURATION = 5_000;
const PROGRESS_INTERVAL = 50;

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/$/, "");

function getImageUrl(imageUrl: string): string {
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

  return `${API_URL}${normalizedPath}`;
}

export default function HomeStories({ stories }: HomeStoriesProps) {
  const [activeCreator, setActiveCreator] = useState<HomeStory | null>(null);
  const [creatorStories, setCreatorStories] = useState<PublicStory[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingStories, setLoadingStories] = useState(false);
  const [error, setError] = useState("");

  async function openStories(creator: HomeStory) {
    try {
      setActiveCreator(creator);
      setCreatorStories([]);
      setActiveIndex(0);
      setProgress(0);
      setLoadingStories(true);
      setError("");

      const result = await storyService.getPublic(creator.username);

      setCreatorStories(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les stories.",
      );
    } finally {
      setLoadingStories(false);
    }
  }

  const closeStories = useCallback(() => {
    setActiveCreator(null);
    setCreatorStories([]);
    setActiveIndex(0);
    setProgress(0);
    setError("");
  }, []);

  const showPreviousStory = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex > 0 ? currentIndex - 1 : currentIndex,
    );

    setProgress(0);
  }, []);

  const showNextStory = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex < creatorStories.length - 1
        ? currentIndex + 1
        : currentIndex,
    );

    setProgress(0);
  }, [creatorStories.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!activeCreator) {
        return;
      }

      if (event.key === "Escape") {
        closeStories();
      }

      if (event.key === "ArrowLeft") {
        showPreviousStory();
      }

      if (event.key === "ArrowRight") {
        showNextStory();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCreator, closeStories, showNextStory, showPreviousStory]);

  useEffect(() => {
    if (
      !activeCreator ||
      loadingStories ||
      error ||
      creatorStories.length === 0
    ) {
      return;
    }

    setProgress(0);

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);

      setProgress(nextProgress);

      if (elapsed >= STORY_DURATION) {
        window.clearInterval(intervalId);

        if (activeIndex < creatorStories.length - 1) {
          setActiveIndex((currentIndex) => currentIndex + 1);
          setProgress(0);
        } else {
          closeStories();
        }
      }
    }, PROGRESS_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [
    activeCreator,
    activeIndex,
    closeStories,
    creatorStories.length,
    error,
    loadingStories,
  ]);

  useEffect(() => {
    if (creatorStories.length === 0) {
      return;
    }

    const nextStory = creatorStories[activeIndex + 1];

    if (!nextStory) {
      return;
    }

    const image = new Image();
    image.src = getImageUrl(nextStory.imageUrl);
  }, [activeIndex, creatorStories]);

  const currentStory = creatorStories[activeIndex];

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6">
          <p className="text-sm font-medium text-fuchsia-400">Stories</p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Découvrez les stories du moment
          </h2>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <p className="font-semibold text-zinc-300">
              Aucune story disponible
            </p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-3">
            {stories.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() => void openStories(story)}
                className="group min-w-[88px] text-left"
              >
                <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-pink-500 p-[3px]">
                  <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-black bg-zinc-900">
                    <img
                      src={getImageUrl(story.avatarUrl || story.imageUrl)}
                      alt={story.displayName || story.username}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>

                <p className="mt-2 truncate text-center text-xs font-semibold text-white">
                  {story.displayName || story.username}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {activeCreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4">
          <button
            type="button"
            onClick={closeStories}
            aria-label="Fermer les stories"
            className="absolute right-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-2xl text-white backdrop-blur-md transition hover:bg-white/10"
          >
            ×
          </button>

          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="absolute inset-x-0 top-0 z-20 p-4">
              {creatorStories.length > 0 && (
                <div className="mb-4 flex gap-1">
                  {creatorStories.map((story, index) => {
                    let width = 0;

                    if (index < activeIndex) {
                      width = 100;
                    }

                    if (index === activeIndex) {
                      width = progress;
                    }

                    return (
                      <div
                        key={story.id}
                        className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                      >
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href={`/${activeCreator.username}`}
                className="flex w-fit items-center gap-3"
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border border-white/20 bg-zinc-800">
                  <img
                    src={getImageUrl(
                      activeCreator.avatarUrl || activeCreator.imageUrl,
                    )}
                    alt={activeCreator.displayName || activeCreator.username}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    {activeCreator.displayName || activeCreator.username}
                  </p>

                  <p className="text-xs text-zinc-300">
                    @{activeCreator.username}
                  </p>
                </div>
              </Link>
            </div>

            <div className="relative aspect-[9/16] bg-zinc-900">
              {loadingStories ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              ) : currentStory ? (
                <>
                  <img
                    src={getImageUrl(currentStory.imageUrl)}
                    alt={`Story de ${
                      activeCreator.displayName || activeCreator.username
                    }`}
                    className="h-full w-full object-cover"
                  />

                  {activeIndex > 0 && (
                    <button
                      type="button"
                      onClick={showPreviousStory}
                      aria-label="Story précédente"
                      className="absolute inset-y-0 left-0 z-10 w-1/3"
                    />
                  )}

                  {activeIndex < creatorStories.length - 1 && (
                    <button
                      type="button"
                      onClick={showNextStory}
                      aria-label="Story suivante"
                      className="absolute inset-y-0 right-0 z-10 w-1/3"
                    />
                  )}

                  {activeIndex > 0 && (
                    <button
                      type="button"
                      onClick={showPreviousStory}
                      aria-label="Story précédente"
                      className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-2xl text-white backdrop-blur-md"
                    >
                      ‹
                    </button>
                  )}

                  {activeIndex < creatorStories.length - 1 && (
                    <button
                      type="button"
                      onClick={showNextStory}
                      aria-label="Story suivante"
                      className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-2xl text-white backdrop-blur-md"
                    >
                      ›
                    </button>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center">
                  <p className="text-sm text-zinc-400">
                    Aucune story disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

