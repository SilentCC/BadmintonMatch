'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '~/auth';
import { prisma } from '~/server/prisma';
import { doubleMode, singleMode, updateDoubleRank, updateSingleRank } from './matchScoring';

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
            player1Score: match.player1Id === session.user.id ? validatedTeam1Points : validatedTeam2Points,
            player2Score: match.player2Id === session.user.id ? validatedTeam1Points : validatedTeam2Points
          }
        : {
            partnership1Score: match.partnership1?.player1Id === session.user.id || match.partnership1?.player2Id === session.user.id 
              ? validatedTeam1Points 
              : validatedTeam2Points,
            partnership2Score: match.partnership2?.player1Id === session.user.id || match.partnership2?.player2Id === session.user.id 
              ? validatedTeam1Points 
              : validatedTeam2Points
          })
    }
  });

  // Revalidate the page
  revalidatePath(`/matches/${matchId}`);

  return newRound;
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
          const player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.player1Id ?? '' },
          });

          const player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.player2Id ?? '' },
          });

          let player1points = player1rank?.score ?? 0;
          let player2points = player2rank?.score ?? 0;

          for (const round of match!.rounds) 
          {
            const res = singleMode(player1rank?.score ?? 0, player2rank?.score ?? 0, round.player1Score ?? 0, round.player2Score ?? 0);

            player1points += res.playerADelta;
            player2points += res.playerBDelta;
          }

          await updateSingleRank(match?.player1Id ?? '', player1points);
          await updateSingleRank(match?.player2Id ?? '', player2points);
      }
      else
      {
         const partnership1player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership1?.player1Id ?? '' },
          });
        
          const partnership1player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership1?.player2Id ?? '' },
          });
        
          const partnership2player1rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership2?.player1Id ?? '' },
          });
        
          const partnership2player2rank = await prisma.singleRank.findFirst({
            where: { userId: match?.partnership2?.player2Id ?? '' },
          });

          const partnership1rank = await prisma.doubleRank.findFirst({
            where: { partnershipId: match?.partnership1Id ?? '' },
          });
        
          const partnership2rank = await prisma.doubleRank.findFirst({
            where: { partnershipId: match?.partnership2Id ?? '' },
          });
         
          let partnership1player1points = partnership1player1rank?.score ?? 0;
          let partnership1player2points = partnership1player2rank?.score ?? 0;
          let partnership2player1points = partnership2player1rank?.score ?? 0;
          let partnership2player2points = partnership2player2rank?.score ?? 0;

          let partnership1points = partnership1rank?.score ?? 0;
          let partnership2points = partnership2rank?.score ?? 0;

          for (const round of match!.rounds)
          {
              const res = doubleMode(
                [partnership1player1rank?.score ?? 0, partnership1player2rank?.score ?? 0],
                [partnership2player1rank?.score ?? 0, partnership2player2rank?.score ?? 0],
                round.partnership1Score ?? 0,
                round.partnership2Score ?? 0,
                partnership1rank?.score ?? 0,
                partnership2rank?.score ?? 0
              );

              partnership1player1points += res.teamADelta[0] ?? 0;
              partnership1player2points += res.teamADelta[1] ?? 0;
              partnership2player1points += res.teamBDelta[0] ?? 0;
              partnership2player2points += res.teamBDelta[1] ?? 0;
              partnership1points += res.teamARatingDelta;
              partnership2points += res.teamBRatingDelta;
          }

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


    // Optionally, you can revalidate the path if needed
    revalidatePath(`/matches/${matchId}`);
  }
}