import { api } from "@/services/api";

export interface DashboardData {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    trustScore: number;
    trustLevel: string;
    createdAt: string;
  };

  profile: {
    displayName: string;
    avatarUrl: string | null;
    description: string | null;
    profileQualityScore: number | null;

    phone: string | null;
    whatsapp: string | null;
    telegram: string | null;

    city: {
      id: string;
      name: string;
    } | null;

    language: {
      id: string;
      name: string;
      code: string;
    } | null;
  } | null;

  listing: {
    id: string;
    title: string;
    description: string;
    status: string;
    availableNow: boolean;
    viewCount: number;
    publishedAt: string | null;
    pausedAt: string | null;
    createdAt: string;

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
      position: number;
      isPrimary: boolean;
      faceBlurRequested: boolean;
      faceBlurApplied: boolean;
    }[];
  } | null;

  stats: {
    views: number;
    favorites: number;
    reviews: number;
    contactClicks: number;
  };
}

export const dashboardService = {
  getDashboard(): Promise<DashboardData> {
    return api("/dashboard");
  },
};
