import { api } from "@/services/api";

export interface FavoriteStatus {
  isFavorite: boolean;
  favoriteCount: number;
}

export interface FavoriteActionResponse extends FavoriteStatus {
  message: string;
}

export interface FavoriteProfile {
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface FavoriteListing {
  id: string;
  title: string;
  description: string;
  age: number | null;
  availableNow: boolean;
  viewCount: number;
  boostActiveUntil: string | null;
  favoriteCount: number;

  city: {
    id: string;
    name: string;
  };

  category: {
    id: string;
    name: string;
    slug: string;
  };

  images: {
    id: string;
    url: string;
    isPrimary: boolean;
    position: number;
  }[];

  profile: FavoriteProfile | null;
}

export interface FavoriteItem {
  id: string;
  createdAt: string;
  listing: FavoriteListing;
}

export const favoriteService = {
  add(listingId: string): Promise<FavoriteActionResponse> {
    return api(`/favorites/${listingId}`, {
      method: "POST",
    });
  },

  remove(listingId: string): Promise<FavoriteActionResponse> {
    return api(`/favorites/${listingId}`, {
      method: "DELETE",
    });
  },

  getStatus(listingId: string): Promise<FavoriteStatus> {
    return api(`/favorites/${listingId}/status`);
  },

  getMine(): Promise<FavoriteItem[]> {
    return api("/favorites/me");
  },
};
