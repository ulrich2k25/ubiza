import { api } from "@/services/api";

export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  publicId: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStory {
  id: string;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
}

export interface HomeStory {
  id: string;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export const storyService = {
  getMine(): Promise<Story[]> {
    return api("/stories/me");
  },

  getPublic(username: string): Promise<PublicStory[]> {
    return api(`/stories/public/${encodeURIComponent(username)}`);
  },

  getPublicStories(): Promise<HomeStory[]> {
    return api("/stories/public");
  },

  create(file: File): Promise<Story> {
    const formData = new FormData();

    formData.append("image", file);

    return api("/stories", {
      method: "POST",
      body: formData,
    });
  },

  remove(storyId: string): Promise<{ message: string }> {
    return api(`/stories/${storyId}`, {
      method: "DELETE",
    });
  },
};

