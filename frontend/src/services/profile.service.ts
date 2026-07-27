import { api } from "@/services/api";
import type { PublicCreator } from "@/services/public-profile.service";

export interface PublicProfile {
  username: string;

  displayName: string;

  avatarUrl: string | null;

  description: string | null;

  city: {
    id: string;
    name: string;
  } | null;

  listings: {
    id: string;

    title: string;

    description: string;

    age: number;

    availableNow: boolean;

    images: {
      id: string;

      url: string;

      isPrimary: boolean;

      position: number;
    }[];
  }[];
}

export interface ProfileContact {
  phone: string | null;

  whatsapp: string | null;

  telegram: string | null;
}

/**
 * Liste des profils publics.
 */
export async function getPublicProfiles(): Promise<PublicProfile[]> {
  const response = await api("/profiles/public");

  if (Array.isArray(response)) {
    return response as PublicProfile[];
  }

  if (
    response &&
    typeof response === "object" &&
    "value" in response &&
    Array.isArray((response as { value?: unknown }).value)
  ) {
    return (response as { value: PublicProfile[] }).value;
  }

  return [];
}

/**
 * Informations publiques du profil.
 * Les coordonnées ne sont pas renvoyées.
 */
export async function getPublicProfile(
  username: string,
): Promise<PublicProfile> {
  return api(`/profiles/${username}`);
}

/**
 * Suggestions de profils.
 */
export async function getSuggestions(
  username: string,
): Promise<PublicCreator[]> {
  return api(`/profiles/${username}/suggestions`);
}

/**
 * Coordonnées protégées.
 * Nécessite un utilisateur connecté.
 */
export async function getProfileContact(
  username: string,
): Promise<ProfileContact> {
  return api(`/profiles/${username}/contact`);
}

/**
 * Met à jour les coordonnées du profil connecté.
 */
export async function updateMyContact(
  contact: ProfileContact,
): Promise<ProfileContact> {
  return api("/profiles/me/contact", {
    method: "PATCH",
    body: JSON.stringify(contact),
  });
}

/**
 * Service Profile
 */
export const profileService = {
  getPublicProfiles,
  getPublicProfile,
  getSuggestions,
  getProfileContact,
  updateMyContact,
};
