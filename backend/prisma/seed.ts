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
  await prisma.currency.upsert({
    where: {
      code: 'XAF',
    },
    update: {
      name: 'Franc CFA',
      symbol: 'FCFA',
      isActive: true,
    },
    create: {
      name: 'Franc CFA',
      code: 'XAF',
      symbol: 'FCFA',
      isActive: true,
    },
  });

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
      name: 'Sexcam',
      slug: 'sexcam',
      description: 'Prestations en webcam et contenus privés.',
      displayOrder: 3,
    },
  ];

  const cities = [
    'Douala',
    'Yaoundé',
    'Bafoussam',
    'Kribi',
    'Buea',
    'Bertoua',
    'Limbe',
    'Dschang',
    'Bamenda',
    'Garoua',
    'Ngaoundéré',
    'Maroua',
    'Kumba',
    'Bafia',
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

  const compagnieCategory = await prisma.category.findUnique({
    where: {
      slug: 'compagnie',
    },
  });

  const escortesCategory = await prisma.category.findUnique({
    where: {
      slug: 'escortes',
    },
  });

  if (compagnieCategory && escortesCategory) {
    await prisma.listing.updateMany({
      where: {
        categoryId: compagnieCategory.id,
      },
      data: {
        categoryId: escortesCategory.id,
      },
    });

    await prisma.category.delete({
      where: {
        id: compagnieCategory.id,
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
    console.error('Erreur pendant le seed :', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
