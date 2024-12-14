import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

/**
 * Default selector for SingleRank.
 * It's important to always explicitly say which fields you want to return
 */
const defaultSingleRankSelect = {
  id: true,
  score: true,
  rank: true,
  userId: true,
  user: {
    select: {
      name: true,
      image: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SingleRankSelect;

/**
 * Default selector for DoubleRank.
 */
const defaultDoubleRankSelect = {
  id: true,
  score: true,
  rank: true,
  partnershipId: true,
  partnership: {
    select: {
      player1: {
        select: {
          name: true,
          image: true,
        },
      },
      player2: {
        select: {
          name: true,
          image: true,
        },
      },
      nickname: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DoubleRankSelect;

export const rankRouter = router({
  // Single Player Rankings
  listSingle: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 50;
      const { cursor } = input;

      const items = await prisma.singleRank.findMany({
        select: defaultSingleRankSelect,
        take: limit + 1,
        where: {},
        cursor: cursor
          ? {
              id: cursor,
            }
          : undefined,
        orderBy: {
          score: 'desc',
        },
      });

      // Update ranks based on order
      const updatedItems = await Promise.all(
        items.slice(0, limit).map(async (item, index) => {
          return prisma.singleRank.update({
            where: { id: item.id },
            data: { rank: index + 1 },
            select: defaultSingleRankSelect,
          });
        }),
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: updatedItems,
        nextCursor,
      };
    }),

  // Double Player Rankings
  listDouble: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 50;
      const { cursor } = input;

      const items = await prisma.doubleRank.findMany({
        select: defaultDoubleRankSelect,
        take: limit + 1,
        where: {},
        cursor: cursor
          ? {
              id: cursor,
            }
          : undefined,
        orderBy: {
          score: 'desc',
        },
      });

      // Update ranks based on order
      const updatedItems = await Promise.all(
        items.slice(0, limit).map(async (item, index) => {
          return prisma.doubleRank.update({
            where: { id: item.id },
            data: { rank: index + 1 },
            select: defaultDoubleRankSelect,
          });
        }),
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: updatedItems,
        nextCursor,
      };
    }),

  // Get Single Rank by ID
  getSingleById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { id } = input;
      const rank = await prisma.singleRank.findUnique({
        where: { id },
        select: defaultSingleRankSelect,
      });
      if (!rank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No single rank found with id '${id}'`,
        });
      }
      return rank;
    }),

  // Get Double Rank by ID
  getDoubleById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { id } = input;
      const rank = await prisma.doubleRank.findUnique({
        where: { id },
        select: defaultDoubleRankSelect,
      });
      if (!rank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No double rank found with id '${id}'`,
        });
      }
      return rank;
    }),

  // Update Single Player Score
  updateSingleScore: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        score: z.number().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, score } = input;

      // Find existing rank or create new one
      const existingRank = await prisma.singleRank.findFirst({
        where: { userId },
        select: defaultSingleRankSelect,
      });

      if (existingRank) {
        return prisma.singleRank.update({
          where: { id: existingRank.id },
          data: { score },
          select: defaultSingleRankSelect,
        });
      }

      return prisma.singleRank.create({
        data: {
          userId,
          score,
        },
        select: defaultSingleRankSelect,
      });
    }),

  // Update Double Player Score
  updateDoubleScore: publicProcedure
    .input(
      z.object({
        partnershipId: z.string(),
        score: z.number().min(0),
      }),
    )
    .mutation(async ({ input }) => {
      const { partnershipId, score } = input;

      const existingRank = await prisma.doubleRank.findFirst({
        where: { partnershipId },
      });

      if (existingRank) {
        return prisma.doubleRank.update({
          where: { id: existingRank.id },
          data: { score },
          select: defaultDoubleRankSelect,
        });
      }

      return prisma.doubleRank.create({
        data: {
          partnershipId,
          score,
        },
        select: defaultDoubleRankSelect,
      });
    }),
});
