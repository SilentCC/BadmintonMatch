'use server'

import { prisma } from '~/server/prisma';
import { YearStarsHistory } from '~/components/YearStarsHistory';

export default async function YearStarsPage() {
  // Get all year stars from 2014 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2023 }, (_, i) => currentYear - i);

  const yearStars = await prisma.yearStar.findMany({
    where: {
      year: {
        gte: 2024,
        lte: currentYear
      }
    },
    include: {
      user: true
    },
    orderBy: [
      { year: 'desc' },
      { rank: 'asc' }
    ]
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Stars of the Year History</h1>
      <YearStarsHistory years={years} yearStars={yearStars} />
    </div>
  );
}