import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from '~/server/prisma';

const createMatchSchema = z.object({
  type: z.enum(['SINGLES', 'DOUBLES']),
  player1Id: z.string().nullable(),
  player2Id: z.string().nullable(),
  partnership1: z.object({
    player1Id: z.string(),
    player2Id: z.string(),
  }),
  partnership2: z.object({
    player1Id: z.string(),
    player2Id: z.string(),
  }),
});

export const matchRouter = router({
  create: publicProcedure
    .input(createMatchSchema)
    .mutation(async ({ input }) => {
      try {
        // Create partnerships first
        const partnership1 = await prisma.partnership.create({
          data: {
            player1: { connect: { id: input.partnership1.player1Id } },
            player2: { connect: { id: input.partnership1.player2Id } },
          },
          include: {
            player1: true,
            player2: true,
          }
        });

        const partnership2 = await prisma.partnership.create({
          data: {
            player1: { connect: { id: input.partnership2.player1Id } },
            player2: { connect: { id: input.partnership2.player2Id } },
          },
          include: {
            player1: true,
            player2: true,
          }
        });

        // Create the match with the partnerships
        const match = await prisma.match.create({
          data: {
            type: input.type,
            player1Id: input.player1Id,
            player2Id: input.player2Id,
            partnership1Id: partnership1.id,
            partnership2Id: partnership2.id,
          },
          include: {
            player1: true,
            player2: true,
            partnership1: {
              include: {
                player1: true,
                player2: true,
              }
            },
            partnership2: {
              include: {
                player1: true,
                player2: true,
              }
            }
          }
        });

        return match;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create match',
          cause: error,
        });
      }
    }),

  list: publicProcedure
    .query(async () => {
      return prisma.match.findMany({
        include: {
          player1: true,
          player2: true,
          partnership1: {
            include: {
              player1: true,
              player2: true,
            }
          },
          partnership2: {
            include: {
              player1: true,
              player2: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }),
});