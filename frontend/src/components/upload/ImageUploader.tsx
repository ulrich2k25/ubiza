"use client";

import { useEffect, useState } from "react";
import Dropzone from "@/components/upload/Dropzone";
import ImageCard from "@/components/upload/ImageCard";
import { useImageUpload, type SelectedImage } from "@/hooks/useImageUpload";
import {
  listingImageService,
  type ListingImage,
} from "@/services/listing-image.service";
import { detectFace } from "@/services/face-detection.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface ImageUploaderProps {
  maxImages?: number;
  existingImages?: ListingImage[];
  onImagesChange?: (images: SelectedImage[]) => void;
  onExistingImageRemove?: (imageId: string) => void;
  onExistingImageSetPrimary?: (imageId: string) => void;
  onExistingImagesReorder?: (imageIds: string[]) => void;
}

function getAbsoluteImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageElement = new Image();

    imageElement.crossOrigin = "anonymous";

    imageElement.onload = () => {
      resolve(imageElement);
    };

    imageElement.onerror = () => {
      reject(new Error("Impossible de charger l’image."));
    };

    imageElement.src = url;
  });
}

export default function ImageUploader({
  maxImages = 10,
  existingImages = [],
  onImagesChange,
  onExistingImageRemove,
  onExistingImageSetPrimary,
  onExistingImagesReorder,
}: ImageUploaderProps) {
  const { images, error, remainingSlots, addImages, removeImage } =
    useImageUpload({
      maxImages,
    });

  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const [orderedImages, setOrderedImages] =
    useState<ListingImage[]>(existingImages);

  const [processingImageId, setProcessingImageId] = useState<string | null>(
    null,
  );

  const [faceBlurError, setFaceBlurError] = useState<string | null>(null);

  useEffect(() => {
    setOrderedImages(existingImages);
  }, [existingImages]);

  useEffect(() => {
    onImagesChange?.(images);
  }, [images, onImagesChange]);

  const totalImages = orderedImages.length + images.length;
  const totalMaximum = orderedImages.length + maxImages;

  function updateExistingImage(updatedImage: ListingImage) {
    setOrderedImages((currentImages) =>
      currentImages.map((image) =>
        image.id === updatedImage.id ? updatedImage : image,
      ),
    );
  }

  function handleDragStart(imageId: string) {
    setDraggedImageId(imageId);
  }

  function handleDrop(targetImageId: string) {
    if (!draggedImageId || draggedImageId === targetImageId) {
      setDraggedImageId(null);
      return;
    }

    const currentIndex = orderedImages.findIndex(
      (image) => image.id === draggedImageId,
    );

    const targetIndex = orderedImages.findIndex(
      (image) => image.id === targetImageId,
    );

    if (currentIndex === -1 || targetIndex === -1) {
      setDraggedImageId(null);
      return;
    }

    const reorderedImages = [...orderedImages];

    const [movedImage] = reorderedImages.splice(currentIndex, 1);

    if (!movedImage) {
      setDraggedImageId(null);
      return;
    }

    reorderedImages.splice(targetIndex, 0, movedImage);

    setOrderedImages(reorderedImages);

    const imageIds = reorderedImages.map((image) => image.id);

    onExistingImagesReorder?.(imageIds);

    setDraggedImageId(null);
  }

  async function handleBlurFace(image: ListingImage) {
    if (processingImageId) {
      return;
    }

    setFaceBlurError(null);
    setProcessingImageId(image.id);

    try {
      const imageUrl = getAbsoluteImageUrl(image.url);

      const imageElement = await loadImageElement(
        `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${Date.now()}`,
      );

      const faceBox = await detectFace(imageElement);

      if (!faceBox) {
        setFaceBlurError("Aucun visage n’a été détecté sur cette photo.");
        return;
      }

      const updatedImage = await listingImageService.blurImage(
        image.listingId,
        image.id,
        faceBox,
      );

      updateExistingImage(updatedImage);
    } catch (blurError) {
      setFaceBlurError(
        blurError instanceof Error
          ? blurError.message
          : "Impossible de flouter le visage.",
      );
    } finally {
      setProcessingImageId(null);
    }
  }

  async function handleUnblurFace(image: ListingImage) {
    if (processingImageId) {
      return;
    }

    setFaceBlurError(null);
    setProcessingImageId(image.id);

    try {
      const updatedImage = await listingImageService.unblurImage(
        image.listingId,
        image.id,
      );

      updateExistingImage(updatedImage);
    } catch (unblurError) {
      setFaceBlurError(
        unblurError instanceof Error
          ? unblurError.message
          : "Impossible de restaurer l’image originale.",
      );
    } finally {
      setProcessingImageId(null);
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-fuchsia-300">Photos</p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Ajoutez les photos de votre annonce
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            La photo principale est affichée en premier.
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300">
          {totalImages}/{totalMaximum} photos
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {faceBlurError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {faceBlurError}
        </div>
      ) : null}

      {remainingSlots > 0 ? (
        <Dropzone onFilesSelected={addImages} disabled={remainingSlots === 0} />
      ) : null}

      {totalImages > 0 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orderedImages.map((image, index) => {
              const absoluteUrl = getAbsoluteImageUrl(image.url);

              const previewUrl = `${absoluteUrl}${
                absoluteUrl.includes("?") ? "&" : "?"
              }v=${encodeURIComponent(image.updatedAt)}`;

              return (
                <ImageCard
                  key={image.id}
                  previewUrl={previewUrl}
                  name={`Photo enregistrée ${index + 1}`}
                  index={index}
                  isPrimary={image.isPrimary}
                  isExisting
                  faceBlurApplied={image.faceBlurApplied}
                  isProcessingFaceBlur={processingImageId === image.id}
                  onRemove={() => onExistingImageRemove?.(image.id)}
                  onSetPrimary={() => onExistingImageSetPrimary?.(image.id)}
                  onDragStart={() => handleDragStart(image.id)}
                  onDrop={() => handleDrop(image.id)}
                  onBlurFace={() => void handleBlurFace(image)}
                  onUnblurFace={() => void handleUnblurFace(image)}
                />
              );
            })}

            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                previewUrl={image.previewUrl}
                name={image.file.name}
                index={orderedImages.length + index}
                isPrimary={orderedImages.length === 0 && index === 0}
                onRemove={() => removeImage(image.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-black/10 px-4 py-3 text-center text-sm text-zinc-500">
          Aucune photo sélectionnée.
        </div>
      )}
    </section>
  );
}
