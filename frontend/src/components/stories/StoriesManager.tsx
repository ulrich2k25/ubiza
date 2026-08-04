"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Story, storyService } from "@/services/story.service";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/$/, "");

function getStoryImageUrl(imageUrl: string): string {
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

export default function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStories = useCallback(async () => {
    try {
      setError("");

      const result = await storyService.getMine();

      setStories(
        result.filter(
          (story) => new Date(story.expiresAt).getTime() > Date.now(),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les stories.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStories();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStories]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();

      setNow(currentTime);

      setStories((currentStories) =>
        currentStories.filter(
          (story) => new Date(story.expiresAt).getTime() > currentTime,
        ),
      );
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openFileSelector() {
    fileInputRef.current?.click();
  }

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setError("");
    setSuccessMessage("");

    if (!file) {
      resetSelection();
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formats acceptés : JPG, PNG et WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("La photo ne doit pas dépasser 10 Mo.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile || uploading) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const createdStory = await storyService.create(selectedFile);

      setStories((currentStories) => [createdStory, ...currentStories]);

      resetSelection();
      setSuccessMessage("Votre story a été publiée.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de publier la story.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(storyId: string) {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette story ?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingStoryId(storyId);
      setError("");
      setSuccessMessage("");

      await storyService.remove(storyId);

      setStories((currentStories) =>
        currentStories.filter((story) => story.id !== storyId),
      );

      setSuccessMessage("La story a été supprimée.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la story.",
      );
    } finally {
      setDeletingStoryId(null);
    }
  }

  return (
    <section className="relative mt-8 overflow-hidden rounded-[32px] border border-white/10 bg-[#111116] shadow-2xl shadow-black/20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative border-b border-white/10 px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 shadow-lg shadow-fuchsia-950/20">
              <StoryIcon />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-400">
                Contenu temporaire
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Mes stories
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Partagez des moments avec vos visiteurs. Chaque story reste
                visible pendant 24 heures.
              </p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/20">
            <span className="relative flex h-3 w-3">
              {stories.length > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              )}

              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${
                  stories.length > 0 ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
            </span>

            <div>
              <p className="text-sm font-bold text-white">
                {stories.length}{" "}
                {stories.length === 1 ? "story active" : "stories actives"}
              </p>

              <p className="text-xs text-zinc-500">Expiration automatique</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative space-y-6 p-5 sm:p-7">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/20 font-bold">
              !
            </span>

            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
              ✓
            </span>

            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />

          {!previewUrl ? (
            <button
              type="button"
              onClick={openFileSelector}
              className="group relative w-full overflow-hidden rounded-[28px] border border-dashed border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.035] to-transparent px-6 py-10 text-left transition duration-300 hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-fuchsia-950/20 sm:px-8"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl transition duration-500 group-hover:bg-fuchsia-500/20" />

              <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-xl shadow-fuchsia-950/40 transition duration-300 group-hover:scale-105 group-hover:rotate-2">
                    <PlusIcon />
                  </div>

                  <div className="mt-5 sm:ml-6 sm:mt-0">
                    <p className="text-xl font-black text-white">
                      Ajouter une nouvelle story
                    </p>

                    <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                      Choisissez une photo pour la partager immédiatement avec
                      les visiteurs de votre profil.
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <FormatBadge label="JPG" />

                      <FormatBadge label="PNG" />

                      <FormatBadge label="WEBP" />

                      <FormatBadge label="10 Mo max." />
                    </div>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black shadow-lg transition group-hover:bg-zinc-100">
                  Choisir une photo
                  <ArrowIcon />
                </span>
              </div>
            </button>
          ) : (
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-5 sm:p-6">
              <div className="grid gap-7 md:grid-cols-[230px_1fr] md:items-center">
                <div className="relative mx-auto aspect-[9/14] w-full max-w-[230px] overflow-hidden rounded-[28px] border border-white/15 bg-zinc-900 shadow-2xl shadow-black/50">
                  <img
                    src={previewUrl}
                    alt="Aperçu de la story"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

                  <div className="absolute left-4 top-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
                      Aperçu
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-xs font-medium text-white/80">
                      Visible pendant 24 heures
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-400">
                    Prête à publier
                  </p>

                  <h3 className="mt-3 text-2xl font-black text-white">
                    Votre story est prête
                  </h3>

                  <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">
                    Elle apparaîtra sur votre profil public et dans la section
                    stories de la page d’accueil.
                  </p>

                  {selectedFile && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="truncate text-sm font-bold text-white">
                        {selectedFile.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-fuchsia-950/30 transition hover:scale-[1.02] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      )}

                      {uploading ? "Publication..." : "Publier la story"}
                    </button>

                    <button
                      type="button"
                      onClick={resetSelection}
                      disabled={uploading}
                      className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={openFileSelector}
                      disabled={uploading}
                      className="rounded-2xl px-3 py-3.5 text-sm font-semibold text-zinc-400 transition hover:text-white disabled:opacity-50"
                    >
                      Changer la photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">
                Stories publiées
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Gérez les stories actuellement visibles.
              </p>
            </div>

            {stories.length > 0 && (
              <button
                type="button"
                onClick={openFileSelector}
                className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
              >
                <span className="text-lg leading-none">+</span>
                Ajouter
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-[28px] border border-white/10 bg-black/20">
              <div className="text-center">
                <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-400" />

                <p className="mt-4 text-sm text-zinc-400">
                  Chargement des stories...
                </p>
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="relative overflow-hidden rounded-[28px] border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center">
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] text-fuchsia-300 shadow-xl shadow-black/20">
                  <EmptyStoryIcon />
                </div>

                <h3 className="mt-6 text-xl font-black text-white">
                  Aucune story publiée
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
                  Vos stories apparaîtront ici après leur publication et seront
                  visibles pendant 24 heures.
                </p>

                <button
                  type="button"
                  onClick={openFileSelector}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-fuchsia-950/30 transition hover:scale-[1.02] hover:opacity-95"
                >
                  <PlusSmallIcon />
                  Publier ma première story
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  now={now}
                  deleting={deletingStoryId === story.id}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StoryCard({
  story,
  now,
  deleting,
  onDelete,
}: {
  story: Story;
  now: number;
  deleting: boolean;
  onDelete: (storyId: string) => Promise<void>;
}) {
  return (
    <article className="group relative rounded-[24px] bg-gradient-to-br from-fuchsia-500/70 via-violet-500/40 to-transparent p-[1px] shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-950/30">
      <div className="relative overflow-hidden rounded-[23px] bg-zinc-950">
        <div className="relative aspect-[9/14] overflow-hidden bg-zinc-900">
          <img
            src={getStoryImageUrl(story.imageUrl)}
            alt="Story publiée"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/40" />

          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[11px] font-black text-white shadow-lg backdrop-blur-md">
              <ClockIcon />

              {getRemainingTime(story.expiresAt, now)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => void onDelete(story.id)}
            disabled={deleting}
            aria-label="Supprimer la story"
            title="Supprimer la story"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:border-red-400/30 hover:bg-red-500/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <TrashIcon />
            )}
          </button>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Publiée
            </p>

            <p className="mt-1 text-xs font-bold text-white">
              {formatDate(story.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function FormatBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-400">
      {label}
    </span>
  );
}

function StoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7 text-fuchsia-300"
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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlusSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

function EmptyStoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-9 w-9"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="5" />

      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />

      <path strokeLinecap="round" d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 3h6m-8 4h10m-9 0 .6 12h6.8L16 7M10 10v6m4-6v6"
      />
    </svg>
  );
}

function getRemainingTime(expiresAt: string, now: number): string {
  const remainingMilliseconds = new Date(expiresAt).getTime() - now;

  if (remainingMilliseconds <= 0) {
    return "Expirée";
  }

  const remainingMinutes = Math.ceil(remainingMilliseconds / (60 * 1000));

  if (remainingMinutes < 60) {
    return `${remainingMinutes} min`;
  }

  const remainingHours = Math.ceil(remainingMinutes / 60);

  return `${remainingHours} h`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatFileSize(size: number): string {
  const sizeInMegabytes = size / (1024 * 1024);

  if (sizeInMegabytes < 1) {
    return `${Math.round(size / 1024)} Ko`;
  }

  return `${sizeInMegabytes.toFixed(1)} Mo`;
}

