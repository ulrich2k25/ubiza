import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const categories = [
    {
      name: 'Escortes',
      slug: 'escortes',
      description: 'Annonces de créatrices indépendantes.',
      displayOrder: 1,
    },
    {
      name: 'Massage',
      slug: 'massage',
      description: 'Annonces de massage et bien-être.',
      displayOrder: 2,
    },
    {
      name: 'Compagnie',
      slug: 'compagnie',
      description: 'Annonces de compagnie et rencontres privées.',
      displayOrder: 3,
    },
  ];

  const cities = [
    'Douala',
    'Yaoundé',
    'Bafoussam',
    'Buea',
    'Kribi',
    'Limbe',
    'Garoua',
    'Bamenda',
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
  }

  for (const cityName of cities) {
    await prisma.city.upsert({
      where: {
        name: cityName,
      },
      update: {
        isActive: true,
      },
      create: {
        name: cityName,
        isActive: true,
      },
    });
  }

  console.log('Seed terminé avec succès.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
