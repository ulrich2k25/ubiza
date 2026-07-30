"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;

  faceBlurRequested: boolean;
  faceBox: FaceBox | null;
}

interface UseImageUploadOptions {
  maxImages?: number;
}

function createImageId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export function useImageUpload({ maxImages = 10 }: UseImageUploadOptions = {}) {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState("");

  const imagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const addImages = useCallback(
    (files: File[]) => {
      setError("");

      setImages((currentImages) => {
        const remainingSlots = maxImages - currentImages.length;

        if (remainingSlots <= 0) {
          setError(`Vous pouvez ajouter au maximum ${maxImages} photos.`);

          return currentImages;
        }

        const filesToAdd = files.slice(0, remainingSlots);

        if (files.length > remainingSlots) {
          setError(
            `Seulement ${remainingSlots} photo${
              remainingSlots > 1 ? "s" : ""
            } supplémentaire${
              remainingSlots > 1 ? "s" : ""
            } autorisée${remainingSlots > 1 ? "s" : ""}.`,
          );
        }

        const newImages: SelectedImage[] = filesToAdd.map((file) => ({
          id: createImageId(),
          file,
          previewUrl: URL.createObjectURL(file),

          faceBlurRequested: false,
          faceBox: null,
        }));

        return [...currentImages, ...newImages];
      });
    },
    [maxImages],
  );

  const removeImage = useCallback((imageId: string) => {
    setImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });

    setError("");
  }, []);

  const setFaceBlurRequested = useCallback(
    (imageId: string, requested: boolean) => {
      setImages((currentImages) =>
        currentImages.map((image) =>
          image.id === imageId
            ? {
                ...image,
                faceBlurRequested: requested,
              }
            : image,
        ),
      );
    },
    [],
  );

  const setFaceBox = useCallback((imageId: string, faceBox: FaceBox | null) => {
    setImages((currentImages) =>
      currentImages.map((image) =>
        image.id === imageId
          ? {
              ...image,
              faceBox,
            }
          : image,
      ),
    );
  }, []);

  const clearImages = useCallback(() => {
    setImages((currentImages) => {
      currentImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });

      return [];
    });

    setError("");
  }, []);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  return {
    images,
    error,
    maxImages,
    remainingSlots: Math.max(0, maxImages - images.length),

    addImages,
    removeImage,
    clearImages,

    setFaceBlurRequested,
    setFaceBox,
  };
}

