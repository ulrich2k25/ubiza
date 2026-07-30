"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";
import { favoriteService } from "@/services/favorite.service";

interface FavoriteButtonProps {
  listingId: string;
  username: string;
}

export default function FavoriteButton({
  listingId,
  username,
}: FavoriteButtonProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady } = useAuth();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) {
      setIsFavorite(false);
      setIsLoadingStatus(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    async function loadStatus() {
      try {
        setIsLoadingStatus(true);
        setError(null);

        const status = await favoriteService.getStatus(listingId);

        if (!isCancelled) {
          setIsFavorite(status.isFavorite);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de vérifier ce favori.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStatus(false);
        }
      }
    }

    void loadStatus();

    return () => {
      isCancelled = true;
    };
  }, [isAuthReady, isAuthenticated, listingId]);

  async function handleFavorite() {
    if (!isAuthReady || isLoadingStatus || isUpdating) {
      return;
    }

    if (!isAuthenticated) {
      const returnUrl = `/${username}`;

      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const response = isFavorite
        ? await favoriteService.remove(listingId)
        : await favoriteService.add(listingId);

      setIsFavorite(response.isFavorite);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier ce favori.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleFavorite}
        disabled={!isAuthReady || isLoadingStatus || isUpdating}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
          isFavorite
            ? "border-rose-500/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
            : "border-white/10 bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        <span aria-hidden="true">{isFavorite ? "❤️" : "🤍"}</span>

        {isUpdating
          ? "Mise à jour..."
          : isFavorite
            ? "Retirer des favoris"
            : "Ajouter aux favoris"}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
