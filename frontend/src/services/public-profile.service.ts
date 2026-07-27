import { api } from "@/services/api";

export interface PublicCreator {
  username: string;

  displayName: string;

  avatarUrl: string | null;

  description: string | null;

  city: {
    id: string;
    name: string;
  } | null;

  listing: {
    id: string;

    title: string;

    age: number;

    availableNow: boolean;

    viewCount: number;

    primaryImage: string | null;
  } | null;
}

export const publicProfileService = {
  getPublicProfiles(): Promise<PublicCreator[]> {
    return api("/profiles/public");
  },
};
