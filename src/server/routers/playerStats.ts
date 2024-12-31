import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { MatchType } from "@prisma/client";
import { prisma } from '~/server/prisma';

export const playerStatsRouter = router({
  // Get stats for a specific player
  getStats: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .query(async ({ input }) => {
      return prisma.playerStats.findUnique({
        where: { playerId: input.playerId },
      });
    }),

  // Refresh/Initialize player's entire stats history
  updateStats: publicProcedure
    .input(z.object({ playerId: z.string() }))
    .mutation(async ({ input }) => {
      // Get all closed matches involving the player
      const matches = await prisma.match.findMany({
        where: {
          closed: true,
          OR: [
            { player1Id: input.playerId },
            { player2Id: input.playerId },
            {
              partnership1: {
                OR: [
                  { player1Id: input.playerId },
                  { player2Id: input.playerId }
                ]
              }
            },
            {
              partnership2: {
                OR: [
                  { player1Id: input.playerId },
                  { player2Id: input.playerId }
                ]
              }
            }
          ]
        },
        include: {
          rounds: true,
          partnership1: true,
          partnership2: true
        }
      });

      // Calculate if player won each match
      const wonMatches = matches.filter(match => {
        if (match.type === MatchType.SINGLES) {
          const player1Wins = match.rounds.reduce((sum, round) =>
            sum + (round.player1Score! > round.player2Score! ? 1 : 0), 0);
          const totalRounds = match.rounds.length;

          return match.player1Id === input.playerId
            ? player1Wins > totalRounds / 2
            : player1Wins < totalRounds / 2;
        } else {
          const partnership1Wins = match.rounds.reduce((sum, round) =>
            sum + (round.partnership1Score! > round.partnership2Score! ? 1 : 0), 0);
          const totalRounds = match.rounds.length;

          const isInPartnership1 = match.partnership1?.player1Id === input.playerId ||
                                  match.partnership1?.player2Id === input.playerId;

          return isInPartnership1
            ? partnership1Wins > totalRounds / 2
            : partnership1Wins < totalRounds / 2;
        }
      }).length;

      const totalMatches = matches.length;
      const lostMatches = totalMatches - wonMatches;
      const winPercentage = totalMatches > 0
        ? Number(((wonMatches / totalMatches) * 100).toFixed(2))
        : 0;

      // Update or create stats record
      return prisma.playerStats.upsert({
        where: { playerId: input.playerId },
        create: {
          playerId: input.playerId,
          totalMatches,
          wonMatches,
          lostMatches,
          winPercentage
        },
        update: {
          totalMatches,
          wonMatches,
          lostMatches,
          winPercentage,
          updatedAt: new Date()
        }
      });
    }),

  // Update stats for all players in a match
  updateMatchStats: publicProcedure
    .input(z.object({
      matchId: z.string()
    }))
    .mutation(async ({ input }) => {
      const match = await prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          rounds: true,
          player1: true,
          player2: true,
          partnership1: true,
          partnership2: true,
        }
      });

      if (!match || !match.closed) {
        throw new Error('Match not found or not closed');
      }

      // Get all players involved
      const playerStats = new Map<string, { wins: number; losses: number }>();

      if (match.type === MatchType.SINGLES) {
        const player1Id = match.player1Id!;
        const player2Id = match.player2Id!;

        // Initialize stats for both players
        playerStats.set(player1Id, { wins: 0, losses: 0 });
        playerStats.set(player2Id, { wins: 0, losses: 0 });

        // Count wins and losses for each round
        match.rounds.forEach(round => {
          if (round.player1Score! > round.player2Score!) {
            // Player 1 won this round
            playerStats.get(player1Id)!.wins++;
            playerStats.get(player2Id)!.losses++;
          } else if (round.player2Score! > round.player1Score!) {
            // Player 2 won this round
            playerStats.get(player2Id)!.wins++;
            playerStats.get(player1Id)!.losses++;
          }
        });
      } else {
        // For doubles matches
        if (!match.partnership1 || !match.partnership2) {
          throw new Error('Invalid doubles match: missing partnerships');
        }

        const players = [
          match.partnership1.player1Id,
          match.partnership1.player2Id,
          match.partnership2.player1Id,
          match.partnership2.player2Id
        ];

        // Initialize stats for all players
        players.forEach(playerId => {
          playerStats.set(playerId, { wins: 0, losses: 0 });
        });

        // Count wins and losses for each round
        match.rounds.forEach(round => {
          if (round.partnership1Score! > round.partnership2Score!) {
            playerStats.get(match.partnership1!.player1Id)!.wins++;
            playerStats.get(match.partnership1!.player2Id)!.wins++;
            playerStats.get(match.partnership2!.player1Id)!.losses++;
            playerStats.get(match.partnership2!.player2Id)!.losses++;
          } else if (round.partnership2Score! > round.partnership1Score!) {
            playerStats.get(match.partnership2!.player1Id)!.wins++;
            playerStats.get(match.partnership2!.player2Id)!.wins++;
            playerStats.get(match.partnership1!.player1Id)!.losses++;
            playerStats.get(match.partnership1!.player2Id)!.losses++;
          }
        });
      }

      // Update stats for all players
      for (const [playerId, stats] of playerStats) {
        const currentStats = await prisma.playerStats.findUnique({
          where: { playerId }
        });

        const newTotal = (currentStats?.totalMatches ?? 0) + stats.wins + stats.losses;
        const newWins = (currentStats?.wonMatches ?? 0) + stats.wins;
        const newPercentage = Number(((newWins / newTotal) * 100).toFixed(2));

        await prisma.playerStats.upsert({
          where: { playerId },
          create: {
            playerId,
            totalMatches: stats.wins + stats.losses,
            wonMatches: stats.wins,
            lostMatches: stats.losses,
            winPercentage: stats.wins + stats.losses > 0
              ? Number((stats.wins / (stats.wins + stats.losses) * 100).toFixed(2))
              : 0
          },
          update: {
            totalMatches: { increment: stats.wins + stats.losses },
            wonMatches: { increment: stats.wins },
            lostMatches: { increment: stats.losses },
            winPercentage: newPercentage
          }
        });
      }

      return { success: true };
    }),
});