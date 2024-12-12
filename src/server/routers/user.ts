import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import bcrypt from 'bcrypt';

const defaultUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} satisfies Prisma.UserSelect;

export const userRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {

      const limit = input.limit ?? 50;
      const { cursor } = input;

      const items = await prisma.user.findMany({
        select: defaultUserSelect,
        take: limit + 1,
        where: {},
        cursor: cursor
          ? {
              id: cursor,
          }
          : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items: items.reverse(),
        nextCursor,
      };
    }),
  byNameAndPassword: publicProcedure
    .input(
      z.object({
        name: z.string(),
        password: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { name, password } = input;
      const user = await prisma.user.findUnique({
        where: { name, password },
        select: defaultUserSelect,
      });
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User not found with name '${name}'`,
        });
      }
      return user;
    }),
  add: publicProcedure
    .input(
      z.object({
        name: z.string(),
        password: z.string(),
        image: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { name, password, image } = input;
      input.password = bcrypt.hashSync(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          password: input.password,
          image,
        },
        select: defaultUserSelect,
      });
      return user;
    }),
  updateAvatar: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        avatarUrl: z.string().url(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, avatarUrl } = input;
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image: avatarUrl }, 
        select: defaultUserSelect,
      });

      return updatedUser;
    }),
})