"use client";

interface ImageCardProps {
  previewUrl: string;
  name: string;
  index: number;
  onRemove: () => void;

  onSetPrimary?: () => void;
  isPrimary?: boolean;
  isExisting?: boolean;
  onDragStart?: () => void;
  onDrop?: () => void;

  faceBlurApplied?: boolean;
  isProcessingFaceBlur?: boolean;
  onBlurFace?: () => void;
  onUnblurFace?: () => void;
}

export default function ImageCard({
  previewUrl,
  name,
  index,
  onRemove,
  onSetPrimary,
  isPrimary = false,
  isExisting = false,
  onDragStart,
  onDrop,
  faceBlurApplied = false,
  isProcessingFaceBlur = false,
  onBlurFace,
  onUnblurFace,
}: ImageCardProps) {
  return (
    <article
      draggable={isExisting && !isProcessingFaceBlur}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-black/20">
        <img
          src={previewUrl}
          alt={`Aperçu ${index + 1}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />

        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          Photo {index + 1}
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={isProcessingFaceBlur}
          aria-label={`Supprimer ${name}`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/60 text-sm text-white backdrop-blur transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ✕
        </button>

        {faceBlurApplied ? (
          <div className="absolute bottom-3 left-3 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/20 px-3 py-1 text-xs font-medium text-fuchsia-200 backdrop-blur">
            Visage flouté
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <p title={name} className="truncate text-sm font-medium text-white">
          {name}
        </p>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-zinc-500">
            {isExisting ? "Déjà enregistrée" : "Prête à être envoyée"}
          </span>

          {isPrimary ? (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-300">
              ⭐ Principale
            </span>
          ) : null}
        </div>

        {isExisting ? (
          <div className="space-y-2">
            {faceBlurApplied && onUnblurFace ? (
              <button
                type="button"
                onClick={onUnblurFace}
                disabled={isProcessingFaceBlur}
                className="w-full rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-2 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessingFaceBlur
                  ? "Restauration en cours…"
                  : "↩ Restaurer l’image originale"}
              </button>
            ) : null}

            {!faceBlurApplied && onBlurFace ? (
              <button
                type="button"
                onClick={onBlurFace}
                disabled={isProcessingFaceBlur}
                className="w-full rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-2 text-sm font-medium text-fuchsia-200 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessingFaceBlur
                  ? "Détection du visage…"
                  : "👤 Flouter le visage"}
              </button>
            ) : null}
          </div>
        ) : null}

        {isExisting && !isPrimary && onSetPrimary ? (
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={isProcessingFaceBlur}
            className="w-full rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⭐ Définir comme principale
          </button>
        ) : null}
      </div>
    </article>
  );
}
