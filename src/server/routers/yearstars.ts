import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { prisma } from '../prisma';

export const yearStarsRouter = router({

  updateLastYearStars: publicProcedure
    .input(z.object({
      year: z.number().int()
    }))
    .mutation(async ({ input }) => {
      // Get top 3 players from SingleRank
      const topPlayers = await prisma.singleRank.findMany({
        take: 3,
        orderBy: {
          score: 'desc'
        },
        include: {
          user: true
        }
      });

      // Create or update year stars for each top player
      const yearStars = await Promise.all(
        topPlayers.map(async (player, index) => {
          return prisma.yearStar.upsert({
            where: {
              year_rank: {
                year: input.year,
                rank: index + 1
              }
            },
            update: {
              score: player.score,
              userId: player.userId
            },
            create: {
              year: input.year,
              rank: index + 1,
              score: player.score,
              userId: player.userId
            }
          });
        })
      );

      return yearStars;
    }),

  // Optional: Add a query to get year stars
  getYearStars: publicProcedure
    .input(z.object({
      year: z.number().int()
    }))
    .query(async ({ input }) => {
      return prisma.yearStar.findMany({
        where: {
          year: input.year
        },
        include: {
          user: true
        },
        orderBy: {
          rank: 'asc'
        }
      });
    })
});