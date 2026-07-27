import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { StoredFile } from '../storage/types/stored-file.interface';
import type { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    userId: string,
    storedFile: StoredFile,
    createStoryDto?: CreateStoryDto,
  ) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    /*
     * Le floutage des Stories sera ajouté séparément.
     * Le DTO est déjà prévu pour cette future fonctionnalité.
     */
    void createStoryDto;

    return this.prisma.story.create({
      data: {
        userId,
        imageUrl: storedFile.url,
        publicId: storedFile.publicId,
        expiresAt,
      },
    });
  }

  async findMine(userId: string) {
    return this.prisma.story.findMany({
      where: {
        userId,

        expiresAt: {
          gt: new Date(),
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPublicByUsername(username: string) {
    const profile = await this.prisma.profile.findFirst({
      where: {
        username,

        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },
        },
      },

      select: {
        userId: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profil introuvable.');
    }

    return this.prisma.story.findMany({
      where: {
        userId: profile.userId,

        expiresAt: {
          gt: new Date(),
        },
      },

      select: {
        id: true,
        imageUrl: true,
        createdAt: true,
        expiresAt: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async remove(userId: string, storyId: string) {
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        userId,
      },
    });

    if (!story) {
      throw new NotFoundException(
        'Story introuvable ou vous n’êtes pas le propriétaire.',
      );
    }

    await this.prisma.story.delete({
      where: {
        id: story.id,
      },
    });

    await this.storageService.delete(story.imageUrl);

    return {
      message: 'Story supprimée avec succès.',
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStories(): Promise<void> {
    const expiredStories = await this.prisma.story.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },

      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (expiredStories.length === 0) {
      return;
    }

    await this.prisma.story.deleteMany({
      where: {
        id: {
          in: expiredStories.map((story) => story.id),
        },
      },
    });

    await Promise.all(
      expiredStories.map((story) => this.storageService.delete(story.imageUrl)),
    );

    this.logger.log(
      `${expiredStories.length} story(s) expirée(s) supprimée(s).`,
    );
  }

  async findPublicStories() {
    const stories = await this.prisma.story.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },

        user: {
          deletedAt: null,

          listings: {
            some: {
              status: 'PUBLISHED',
              deletedAt: null,
            },
          },

          profile: {
            username: {
              not: null,
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      include: {
        user: {
          include: {
            profile: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const uniqueStories = new Map<string, (typeof stories)[number]>();

    for (const story of stories) {
      if (!uniqueStories.has(story.userId)) {
        uniqueStories.set(story.userId, story);
      }
    }

    return [...uniqueStories.values()].map((story) => ({
      id: story.id,
      imageUrl: story.imageUrl,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      username: story.user.profile?.username,
      displayName: story.user.profile?.displayName,
      avatarUrl: story.user.profile?.avatarUrl,
    }));
  }
}
