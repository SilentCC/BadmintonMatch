'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '~/auth';
import { prisma } from '~/server/prisma';
import { doubleMode, singleMode, updateDoubleRank, updateSingleRank} from './matchScoring';
import { User } from "@prisma/client";

interface DoubleMatch
{
    partnership1Player1: User;
    partnership1Player2: User;

    partnership2Player1: User;
    partnership2Player2: User;
}

export async function updateMatchRound(roundId: string, team1Points: number, team2Points: number) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const pointsSchema = z.number().min(0).max(30);
  const validatedTeam1Points = pointsSchema.parse(team1Points);
  const validatedTeam2Points = pointsSchema.parse(team2Points);

  // Check if the user is a participant in the match
  const round = await prisma.matchRound.findUnique({
    where: { id: roundId },
    include: {
      match: {
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
      }
    }
  });

  if (!round) {
    throw new Error(`MatchRound with ID ${roundId} not found`);
  }

  const match = round.match;

  if (!match) {
    throw new Error(`No match associated with MatchRound ID ${roundId}`);
  }

  const isParticipant = match.type === 'SINGLES'
    ? (match.player1Id === session.user.id || match.player2Id === session.user.id)
    : (
        (match.partnership1?.player1Id === session.user.id ||
         match.partnership1?.player2Id === session.user.id) ||
        (match.partnership2?.player1Id === session.user.id ||
         match.partnership2?.player2Id === session.user.id)
      );

  if (!isParticipant) {
    throw new Error('Only match participants can update round points');
  }

  // Update the round
  const updatedRound = await prisma.matchRound.update({
    where: { id: roundId },
    data: match.type === 'SINGLES'
      ? {
          player1Score: validatedTeam1Points,
          player2Score: validatedTeam2Points
        }
      : {
          partnership1Score: validatedTeam1Points,
          partnership2Score: validatedTeam2Points
        }
  });

  // Revalidate the match details page
  revalidatePath(`/matches/${match.id}`);

  return updatedRound;
}

export async function addMatchRound(matchId: string, team1Points: number, team2Points: number) {

  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const pointsSchema = z.number().min(0).max(30);
  const validatedTeam1Points = pointsSchema.parse(team1Points);
  const validatedTeam2Points = pointsSchema.parse(team2Points);

  // Check if the user is a participant in the match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
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
      },
      rounds: {
        select: { roundNumber: true },
        orderBy: { roundNumber: 'desc' }
      }
    }
  });

  if (!match) {
    throw new Error(`Match with ID ${matchId} not found`);
  }

  // Check if the user is a participant
  const isParticipant = match.type === 'SINGLES'
    ? [match.player1Id, match.player2Id].includes(session.user.id)
    : [
        match.partnership1?.player1Id,
        match.partnership1?.player2Id,
        match.partnership2?.player1Id,
        match.partnership2?.player2Id
      ].includes(session.user.id);

  if (!isParticipant) {
    throw new Error('Unauthorized: Not a participant in this match');
  }

  // Determine the next round number
  const nextRoundNumber = match.rounds.length > 0
    ? (match.rounds[0]?.roundNumber ?? 1) + 1
    : 1;

  // Create new round
  const newRound = await prisma.matchRound.create({
    data: {
      matchId: match.id,
      roundNumber: nextRoundNumber,
      ...(match.type === 'SINGLES'
        ? {
            player1Score: validatedTeam1Points,
            player2Score: validatedTeam2Points
          }
        : {
            partnership1Score: validatedTeam1Points,
            partnership2Score: validatedTeam2Points
          })
    }
  });

  // Revalidate the page
  revalidatePath(`/matches/${matchId}`);

  return newRound;
}

async function updatePlayerStats(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      rounds: true,
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

  if (!match) return;

  // Calculate total matches, wins, losses for each player
  const updateStats = async (userId: string, winnerNumber: number, loserNumber: number) => {
    let playerStats = await prisma.playerStats.findUnique({
      where: { playerId: userId }
    });

    if (!playerStats) {
      playerStats = await prisma.playerStats.create({
        data: {
          playerId: userId,
          totalMatches: 0,
          wonMatches: 0,
          lostMatches: 0,
          winPercentage: 0
        }
      });
    }

    const totalMatches = playerStats.totalMatches + winnerNumber + loserNumber;
    const wonMatches = playerStats.wonMatches + winnerNumber;
    const lostMatches = playerStats.lostMatches + loserNumber;
    const winPercentage = Math.round((wonMatches / totalMatches) * 100);

    await prisma.playerStats.update({
      where: { playerId: userId },
      data: {
        totalMatches,
        wonMatches,
        lostMatches,
        winPercentage
      }
    });
  };

  if (match.type === 'SINGLES') {
    let player1winns = 0;
    let player1loses = 0;
    let player2winns = 0;
    let player2loses = 0;

    for (const round of match.rounds)
    {
      if (round.player1Score && round.player2Score)
      {
        if (round.player1Score > round.player2Score)
        {
          player1winns++;
          player2loses++;
        }
        else
        {
          player2winns++;
          player1loses++;
        }
      }
    }

    await updateStats(match.player1Id ?? '', player1winns, player1loses);
    await updateStats(match.player2Id ?? '', player2winns, player2loses);
  } else {

    let partnership1player1winns = 0;
    let partnership1player1loses = 0;
    let partnership1player2winns = 0;
    let partnership1player2loses = 0;
    let partnership2player1winns = 0;
    let partnership2player1loses = 0;
    let partnership2player2winns = 0;
    let partnership2player2loses = 0;

    for (const round of match.rounds)
    {
      if (round.partnership1Score && round.partnership2Score)
      {
        if (round.partnership1Score > round.partnership2Score)
        {
          partnership1player1winns++;
          partnership1player2winns++;
          partnership2player1loses++;
          partnership2player2loses++;
        }
        else
        {
          partnership2player1winns++;
          partnership2player2winns++;
          partnership1player1loses++;
          partnership1player2loses++;
        }
      }
    }

    if (match.partnership1?.player1Id && match.partnership1?.player2Id) {
      await updateStats(match.partnership1.player1Id, partnership1player1winns, partnership1player1loses);
      await updateStats(match.partnership1.player2Id, partnership1player2winns, partnership1player2loses);
    }

    if (match.partnership2?.player1Id && match.partnership2?.player2Id) {
      await updateStats(match.partnership2.player1Id, partnership2player1winns, partnership2player1loses);
      await updateStats(match.partnership2.player2Id, partnership2player2winns, partnership2player2loses);
    }
  }
}

export async function updateMatchClosedStatus(matchId: string, isClosed: boolean) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Update the match status in the database
  await prisma.match.update({
    where: { id: matchId },
    data: { closed : isClosed },
  });

  if (isClosed) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        rounds: true, // Including rounds to access points
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

    if (isClosed)
    {
      if(match!.type === 'SINGLES')
      {
          let player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.player1Id ?? '' },
          });

          let player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.player2Id ?? '' },
          });

          if (!player1rank) {
            player1rank = await prisma.singleRank.create({
              data: {
                userId: match?.player1Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for player 1:', player1rank);
          }

          if (!player2rank) {
            player2rank = await prisma.singleRank.create({
              data: {
                userId: match?.player2Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for player 2:', player2rank);
          }

          let player1points = player1rank.score ?? 0;
          let player2points = player2rank.score ?? 0;

          for (const round of match!.rounds)
          {
            const res = await singleMode(player1rank.score ?? 0, player2rank.score ?? 0, round.player1Score ?? 0, round.player2Score ?? 0);

            player1points += res.playerADelta;
            player2points += res.playerBDelta;
          }

          player1points = Math.max(player1points, player1rank.score ?? 0);
          player2points = Math.max(player2points, player2rank.score ?? 0);

          await updateSingleRank(match?.player1Id ?? '', player1points);
          await updateSingleRank(match?.player2Id ?? '', player2points);
      }
      else
      {
          let partnership1player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership1?.player1Id ?? '' },
          });

          let partnership1player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership1?.player2Id ?? '' },
          });

          let partnership2player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership2?.player1Id ?? '' },
          });

          let partnership2player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership2?.player2Id ?? '' },
          });

          const partnership1rank = await prisma.doubleRank.findFirst({
            where: { partnershipId: match?.partnership1Id ?? '' },
          });

          const partnership2rank = await prisma.doubleRank.findFirst({
            where: { partnershipId: match?.partnership2Id ?? '' },
          });

          if (!partnership1player1rank) {
            partnership1player1rank = await prisma.singleRank.create({
              data: {
                userId: match?.partnership1?.player1Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for partnership 1 player 1:', partnership1player1rank);
          }

          if (!partnership1player2rank) {
            partnership1player2rank = await prisma.singleRank.create({
              data: {
                userId: match?.partnership1?.player2Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for partnership 1 player 2:', partnership1player2rank);
          }

          if (!partnership2player1rank) {
            partnership2player1rank = await prisma.singleRank.create({
              data: {
                userId: match?.partnership2?.player1Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for partnership 2 player 1:', partnership2player1rank);
          }

          if (!partnership2player2rank) {
            partnership2player2rank = await prisma.singleRank.create({
              data: {
                userId: match?.partnership2?.player2Id ?? '',
                score: 0,
              },
            });
            console.log('New single rank created for partnership 2 player 2:', partnership2player2rank);
          }

          let partnership1player1points = partnership1player1rank.score ?? 0;
          let partnership1player2points = partnership1player2rank.score ?? 0;
          let partnership2player1points = partnership2player1rank.score ?? 0;
          let partnership2player2points = partnership2player2rank.score ?? 0;

          let partnership1points = partnership1rank?.score ?? 0;
          let partnership2points = partnership2rank?.score ?? 0;

          for (const round of match!.rounds)
          {
              const res = await doubleMode(
                [partnership1player1rank?.score ?? 0, partnership1player2rank?.score ?? 0],
                [partnership2player1rank?.score ?? 0, partnership2player2rank?.score ?? 0],
                round.partnership1Score ?? 0,
                round.partnership2Score ?? 0,
                partnership1rank?.score ?? 0,
                partnership2rank?.score ?? 0
              );

              partnership1player1points += res.teamADelta[0] ?? 0;
              console.log("partnership1player1points",partnership1player1points);
              partnership1player2points += res.teamADelta[1] ?? 0;
              console.log("partnership1player2points",partnership1player2points);
              partnership2player1points += res.teamBDelta[0] ?? 0;
              console.log("partnership2player1points",partnership2player1points);
              partnership2player2points += res.teamBDelta[1] ?? 0;
              console.log("partnership2player2points",partnership2player2points);
              partnership1points += res.teamARatingDelta;
              console.log("partnership1points",partnership1points);
              partnership2points += res.teamBRatingDelta;
              console.log("partnership2points",partnership2points);
          }

          partnership1player1points = Math.max(partnership1player1points, partnership1player1rank.score ?? 0);
          partnership1player2points = Math.max(partnership1player2points, partnership1player2rank.score ?? 0);
          partnership2player1points = Math.max(partnership2player1points, partnership2player1rank.score ?? 0);
          partnership2player2points = Math.max(partnership2player2points, partnership2player2rank.score ?? 0);

          partnership1points = Math.max(partnership1points, 0);
          partnership2points = Math.max(partnership2points, 0);


          await updateSingleRank(match?.partnership1?.player1Id ?? '', partnership1player1points);
          await updateSingleRank(match?.partnership1?.player2Id ?? '', partnership1player2points);
          await updateSingleRank(match?.partnership2?.player1Id ?? '', partnership2player1points);
          await updateSingleRank(match?.partnership2?.player2Id ?? '', partnership2player2points);

          await updateDoubleRank(match?.partnership1Id ?? '', partnership1points);
          await updateDoubleRank(match?.partnership2Id ?? '', partnership2points);
      }
    }

    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    await updatePlayerStats(matchId);

    revalidatePath(`/matches/${matchId}`);
  }
}

async function calculatePlayerStrength(user: User): Promise<number> {
  const userRank = await prisma.singleRank.findFirst({
    where: { userId: user.id }
  });

  return userRank?.score ?? 200; // Default rating if no rank exists
}

export async function generateBalancedDoubleMatches(players: User[]): Promise<DoubleMatch[]> {
  if (players.length < 4) {
    throw new Error('Need at least 4 players')
  }

  // Calculate strength for each player
  const playerStrengths = new Map<string, number>()
  for (const player of players) {
    playerStrengths.set(player.id, await calculatePlayerStrength(player))
  }

  // Sort players by strength
  const sortedByStrength = [...players].sort((a, b) =>
    (playerStrengths.get(b.id) ?? 0) - (playerStrengths.get(a.id) ?? 0)
  )

  // Track appearances
  const appearances = new Map<string, number>()
  players.forEach(p => appearances.set(p.id, 0))

  const matches: DoubleMatch[] = []
  const minMatches = Math.max(4, Math.ceil(players.length / 2) + 1)
  let attempts = 0
  const maxAttempts = 100 // Prevent infinite loop

  // Helper function to get random player from range
  const getRandomPlayerFromRange = (start: number, end: number, exclude: Set<string>) => {
    // First try with appearance limit
    let availablePlayers = sortedByStrength.slice(start, end)
      .filter(p => !exclude.has(p.id) && (appearances.get(p.id) ?? 0) < 2)

    // If no players found, try again without appearance limit
    if (availablePlayers.length === 0) {
      availablePlayers = sortedByStrength.slice(start, end)
        .filter(p => !exclude.has(p.id))
    }

    // If still no players, expand the range
    if (availablePlayers.length === 0) {
      availablePlayers = sortedByStrength
        .filter(p => !exclude.has(p.id))
    }

    return availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
  }

  // Helper function to try creating a match
  const tryCreateMatch = (matchType: number): DoubleMatch | null => {
    const usedInThisMatch = new Set<string>()

    if (matchType === 0) { // Strong vs Strong
      const strongCount = Math.max(4, Math.floor(sortedByStrength.length / 3))
      const p1 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p1) return null
      usedInThisMatch.add(p1.id)

      const p2 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p2) return null
      usedInThisMatch.add(p2.id)

      const p3 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p3) return null
      usedInThisMatch.add(p3.id)

      const p4 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p4) return null

      return {
        partnership1Player1: p1,
        partnership1Player2: p2,
        partnership2Player1: p3,
        partnership2Player2: p4
      }
    }

    if (matchType === 1) { // Mixed
      const strongCount = Math.floor(sortedByStrength.length / 3)
      const weakStart = Math.max(strongCount, sortedByStrength.length - strongCount)

      const p1 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p1) return null
      usedInThisMatch.add(p1.id)

      const p2 = getRandomPlayerFromRange(weakStart, sortedByStrength.length, usedInThisMatch)
      if (!p2) return null
      usedInThisMatch.add(p2.id)

      const p3 = getRandomPlayerFromRange(0, strongCount, usedInThisMatch)
      if (!p3) return null
      usedInThisMatch.add(p3.id)

      const p4 = getRandomPlayerFromRange(weakStart, sortedByStrength.length, usedInThisMatch)
      if (!p4) return null

      return {
        partnership1Player1: p1,
        partnership1Player2: p2,
        partnership2Player1: p3,
        partnership2Player2: p4
      }
    }

    // Balanced (Middle range players)
    const middleStart = Math.floor(sortedByStrength.length / 4)
    const middleEnd = sortedByStrength.length - middleStart

    const players = Array(4).fill(null).map(() => {
      const p = getRandomPlayerFromRange(middleStart, middleEnd, usedInThisMatch)
      if (p) usedInThisMatch.add(p.id)
      return p
    })

    if (players.every(p => p !== null)) {
      return {
        partnership1Player1: players[0]!,
        partnership1Player2: players[1]!,
        partnership2Player1: players[2]!,
        partnership2Player2: players[3]!
      }
    }

    return null
  }

  while (matches.length < minMatches && attempts < maxAttempts) {
    let matchType = 0;
    if(attempts <= 2)
    {
      matchType = attempts;

    }
    else
    {
      matchType = Math.floor(Math.random() * 3)
    }

    const match = tryCreateMatch(matchType)
    attempts++

    if (match) {
      matches.push(match)
      // Update appearances
      appearances.set(match.partnership1Player1.id, (appearances.get(match.partnership1Player1.id) ?? 0) + 1)
      appearances.set(match.partnership1Player2.id, (appearances.get(match.partnership1Player2.id) ?? 0) + 1)
      appearances.set(match.partnership2Player1.id, (appearances.get(match.partnership2Player1.id) ?? 0) + 1)
      appearances.set(match.partnership2Player2.id, (appearances.get(match.partnership2Player2.id) ?? 0) + 1)
    }
  }

  if (matches.length === 0) {
    throw new Error('Unable to generate valid matches')
  }

  return matches
}