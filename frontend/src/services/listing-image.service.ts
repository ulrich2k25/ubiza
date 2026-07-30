import { api } from "@/services/api";

export interface FaceBoxPayload {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ListingImage {
  id: string;
  listingId: string;
  url: string;
  publicId: string | null;
  originalUrl: string | null;
  isPrimary: boolean;
  position: number;
  faceBlurRequested: boolean;
  faceBlurApplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export const listingImageService = {
  uploadImage(listingId: string, file: File): Promise<ListingImage> {
    const formData = new FormData();

    formData.append("image", file);

    return api(`/listings/${listingId}/images`, {
      method: "POST",
      body: formData,
    });
  },

  getImages(listingId: string): Promise<ListingImage[]> {
    return api(`/listings/${listingId}/images`);
  },

  deleteImage(listingId: string, imageId: string): Promise<void> {
    return api(`/listings/${listingId}/images/${imageId}`, {
      method: "DELETE",
    });
  },

  setPrimaryImage(listingId: string, imageId: string): Promise<ListingImage> {
    return api(`/listings/${listingId}/images/${imageId}/primary`, {
      method: "PATCH",
    });
  },

  reorderImages(
    listingId: string,
    imageIds: string[],
  ): Promise<ListingImage[]> {
    return api(`/listings/${listingId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({
        imageIds,
      }),
    });
  },

  blurImage(
    listingId: string,
    imageId: string,
    faceBox: FaceBoxPayload,
  ): Promise<ListingImage> {
    return api(`/listings/${listingId}/images/${imageId}/blur`, {
      method: "PATCH",
      body: JSON.stringify(faceBox),
    });
  },

  unblurImage(listingId: string, imageId: string): Promise<ListingImage> {
    return api(`/listings/${listingId}/images/${imageId}/unblur`, {
      method: "PATCH",
    });
  },
};

