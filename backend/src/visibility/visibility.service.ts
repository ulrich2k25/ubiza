import { Injectable } from '@nestjs/common';

export interface VisibilityInput {
  boostActiveUntil?: Date | null;
  premiumActiveUntil?: Date | null;
  isVerified?: boolean;
  availableNow?: boolean;
  publishedAt?: Date | null;
  viewCount?: number;
}

export interface VisibilityStatus {
  isBoosted: boolean;
  isPremium: boolean;
  isVerified: boolean;
  visibilityPriority: number;
}

@Injectable()
export class VisibilityService {
  /**
   * Détermine si une date d’expiration est encore active.
   */
  isActiveUntil(
    activeUntil: Date | null | undefined,
    now = new Date(),
  ): boolean {
    return Boolean(activeUntil && activeUntil.getTime() > now.getTime());
  }

  /**
   * Calcule les statuts de visibilité d’une annonce.
   *
   * Priorités :
   * - Boost : 1000 points
   * - Premium : 500 points
   * - Vérifié : 100 points
   */
  getVisibilityStatus(
    input: VisibilityInput,
    now = new Date(),
  ): VisibilityStatus {
    const isBoosted = this.isActiveUntil(input.boostActiveUntil, now);

    const isPremium = this.isActiveUntil(input.premiumActiveUntil, now);

    const isVerified = Boolean(input.isVerified);

    const visibilityPriority =
      (isBoosted ? 1000 : 0) + (isPremium ? 500 : 0) + (isVerified ? 100 : 0);

    return {
      isBoosted,
      isPremium,
      isVerified,
      visibilityPriority,
    };
  }

  /**
   * Compare deux annonces selon les règles de visibilité Ubiza.
   *
   * Ordre :
   * 1. Boost actif
   * 2. Premium actif
   * 3. Profil vérifié
   * 4. Disponible maintenant
   * 5. Publication récente
   * 6. Nombre de vues
   */
  compareVisibility(
    first: VisibilityInput,
    second: VisibilityInput,
    now = new Date(),
  ): number {
    const firstStatus = this.getVisibilityStatus(first, now);
    const secondStatus = this.getVisibilityStatus(second, now);

    if (firstStatus.visibilityPriority !== secondStatus.visibilityPriority) {
      return secondStatus.visibilityPriority - firstStatus.visibilityPriority;
    }

    const firstAvailable = first.availableNow ? 1 : 0;
    const secondAvailable = second.availableNow ? 1 : 0;

    if (firstAvailable !== secondAvailable) {
      return secondAvailable - firstAvailable;
    }

    const firstPublishedAt = first.publishedAt?.getTime() ?? 0;

    const secondPublishedAt = second.publishedAt?.getTime() ?? 0;

    if (firstPublishedAt !== secondPublishedAt) {
      return secondPublishedAt - firstPublishedAt;
    }

    const firstViewCount = first.viewCount ?? 0;
    const secondViewCount = second.viewCount ?? 0;

    if (firstViewCount !== secondViewCount) {
      return secondViewCount - firstViewCount;
    }

    return 0;
  }

  /**
   * Trie une liste sans modifier le tableau original.
   *
   * Le sélecteur permet d’utiliser ce service avec les profils,
   * annonces, résultats de recherche et sections de la Home.
   */
  sortByVisibility<T>(items: T[], selector: (item: T) => VisibilityInput): T[] {
    const now = new Date();

    return [...items].sort((first, second) =>
      this.compareVisibility(selector(first), selector(second), now),
    );
  }
}
