'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '~/auth';
import { prisma } from '~/server/prisma';

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

    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }

    const baseScore = 10;
    const scoreMultiplier = 2;
    // Determine match type and calculate scores
    if (match.type === 'SINGLES') {

      let player1Points = 0;
      let player2Points = 0;

      for (const round of match.rounds) {

        // winner points
        const score1 = round.player1Score ?? 0;
        const score2 = round.player2Score ?? 0;

        if(score1 > score2)
        {
          player1Points += baseScore + (score1 - score2) * scoreMultiplier;
          player2Points -= baseScore + (score1 - score2) * scoreMultiplier;
        }
        else if(score2 > score1)
        {
          player2Points += baseScore + (score2 - score1) * scoreMultiplier;
          player1Points -= baseScore + (score2 - score1) * scoreMultiplier;
        }
      }

      await updateSingleRank(match.player1Id ?? '', player1Points);
      await updateSingleRank(match.player2Id ?? '', player2Points);

    } else if (match.type === 'DOUBLES') {
        let partnership1Points = 0;
        let partnership2Points = 0;

        let partnership1player1Points = 0;
        let partnership1player2Points = 0;
        let partnership2player1Points = 0;
        let partnership2player2Points = 0;
      for (const round of match.rounds) {

        const score1 = round.partnership1Score ?? 0;
        const score2 = round.partnership2Score ?? 0;

        if(score1 > score2)
        {
           partnership1Points = baseScore + (score1 - score2) * scoreMultiplier;
           partnership2Points = baseScore - (score1 - score2) * scoreMultiplier;

           partnership1player1Points = baseScore + (score1 - score2) * scoreMultiplier;
           partnership1player2Points = baseScore + (score1 - score2) * scoreMultiplier;
           partnership2player1Points = baseScore - (score1 - score2) * scoreMultiplier;
           partnership2player2Points = baseScore - (score1 - score2) * scoreMultiplier;
        }
        else if(score2 > score1)
        {
           partnership2Points = baseScore + (score2 - score1) * scoreMultiplier;
           partnership1Points = baseScore - (score2 - score1) * scoreMultiplier;

           partnership2player1Points = baseScore + (score2 - score1) * scoreMultiplier;
           partnership2player2Points = baseScore + (score2 - score1) * scoreMultiplier;
           partnership1player1Points = baseScore - (score2 - score1) * scoreMultiplier;
           partnership1player2Points = baseScore - (score2 - score1) * scoreMultiplier;
        }
      }
      
      await updateDoubleRank(match.partnership1?.id ?? '', partnership1Points);
      await updateDoubleRank(match.partnership2?.id ?? '', partnership2Points);

      await updateSingleRank(match.partnership1?.player1.id ?? '', partnership1player1Points);
      await updateSingleRank(match.partnership1?.player2.id ?? '', partnership1player2Points);
      await updateSingleRank(match.partnership2?.player1.id ?? '', partnership2player1Points);
      await updateSingleRank(match.partnership2?.player2.id ?? '', partnership2player2Points);
      }
    }
    // Optionally, you can revalidate the path if needed
    revalidatePath(`/matches/${matchId}`);
  }


async function updateSingleRank(userId: string, points: number) {
  const currentSingleRank = await prisma.singleRank.findFirst({
    where: {  userId },
    select: { score: true },
  });

  if (currentSingleRank) {
    const newScore = currentSingleRank.score + points;
    await prisma.singleRank.updateMany({
      where: { userId },
      data: { score: newScore },
    });
  }
}

async function updateDoubleRank(partnershipId: string, points: number) {
  const currentDoubleRank = await prisma.doubleRank.findFirst({
    where: { partnershipId },
    select: { score: true },
  });

  if (currentDoubleRank) {
    const newScore = currentDoubleRank.score + points;
    await prisma.doubleRank.updateMany({
      where: { partnershipId },
      data: { score: newScore },
    });
  }
}