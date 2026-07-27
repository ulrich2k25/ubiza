"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function Dropzone({
  onFilesSelected,
  disabled = false,
}: DropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      disabled,
      accept: {
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
        "image/webp": [".webp"],
      },
      multiple: true,
    });

  return (
    <div
      {...getRootProps()}
      className={[
        "cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition",
        "bg-white/[0.03]",
        isDragActive
          ? "border-fuchsia-500 bg-fuchsia-500/10"
          : "border-white/10 hover:border-fuchsia-500/50 hover:bg-white/[0.05]",
        isDragReject ? "border-red-500 bg-red-500/10" : "",
        disabled ? "cursor-not-allowed opacity-50" : "",
      ].join(" ")}
    >
      <input {...getInputProps()} />

      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 text-3xl">
          📸
        </div>

        {isDragReject ? (
          <>
            <p className="font-semibold text-red-300">Format non accepté</p>

            <p className="text-sm text-zinc-400">
              Utilisez uniquement des images JPG, PNG ou WEBP.
            </p>
          </>
        ) : isDragActive ? (
          <>
            <p className="font-semibold text-fuchsia-300">
              Déposez les images ici
            </p>

            <p className="text-sm text-zinc-400">
              Relâchez pour ajouter les photos.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-white">
              Déposez vos photos ici
            </p>

            <p className="text-sm text-zinc-400">
              ou cliquez pour sélectionner des images
            </p>

            <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
              Choisir des photos
            </span>

            <p className="text-xs text-zinc-500">
              JPG, PNG ou WEBP · Maximum 10 photos
            </p>
          </>
        )}
      </div>
    </div>
  );
}
