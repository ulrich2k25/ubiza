import { api } from "@/services/api";
import type { ListingImage } from "@/services/listing-image.service";

export type ListingStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "PAUSED"
  | "REJECTED"
  | "DELETED";

export interface CreateListingData {
  title: string;
  description: string;
  age: number;
  cityId: string;
  categoryId: string;
  availableNow: boolean;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  age?: number;
  cityId?: string;
  categoryId?: string;
  availableNow?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  age: number;
  status: ListingStatus;
  availableNow: boolean;
  cityId: string;
  categoryId: string;
  createdAt: string;
  images?: ListingImage[];
}

export const listingService = {
  createListing(data: CreateListingData): Promise<Listing> {
    return api("/listings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getMyListing(): Promise<Listing | null> {
    try {
      return await api("/listings/mine", {
        method: "GET",
      });
    } catch {
      return null;
    }
  },

  updateListing(
    listingId: string,
    data: UpdateListingData,
  ): Promise<Listing> {
    return api(`/listings/${listingId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  publishListing(listingId: string): Promise<Listing> {
    return api(`/listings/${listingId}/publish`, {
      method: "PATCH",
    });
  },

  pauseListing(listingId: string): Promise<Listing> {
    return api(`/listings/${listingId}/pause`, {
      method: "PATCH",
    });
  },

  resumeListing(listingId: string): Promise<Listing> {
    return api(`/listings/${listingId}/resume`, {
      method: "PATCH",
    });
  },

  deleteListing(listingId: string): Promise<Listing> {
    return api(`/listings/${listingId}`, {
      method: "DELETE",
    });
  },
};
