import { Injectable } from '@nestjs/common';
import { ListingStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const cities = await this.prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            listings: {
              where: {
                status: ListingStatus.PUBLISHED,
              },
            },
          },
        },
      },
    });

    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      profileCount: city._count.listings,
    }));
  }
}
