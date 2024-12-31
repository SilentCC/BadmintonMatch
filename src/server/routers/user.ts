import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import bcrypt from 'bcrypt';

const defaultUserSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  image: true,
} satisfies Prisma.UserSelect;

export const userRouter = router({
  list: publicProcedure
    .query(async () => {
      return prisma.user.findMany();
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
        nickname: z.string().optional(),
        password: z.string(),
        image: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { name, nickname, password, image } = input;
      input.password = bcrypt.hashSync(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          nickname,
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
  updateNickname: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        nickname: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userId, nickname } = input;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { nickname },
        select: defaultUserSelect,
      });

      return updatedUser;
    }),
  updatePassword: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, currentPassword, newPassword } = input;

      // Find the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check current password
      if (user.password && !bcrypt.compareSync(currentPassword, user.password)) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

      // Update password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
        select: defaultUserSelect,
      });

      return updatedUser;
    }),
});