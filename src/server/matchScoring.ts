'use server';

import { prisma } from '~/server/prisma';

// Badminton Scoring Algorithm in JavaScript

// Calculate Elo probability
function calculateProbability(ratingA: number, ratingB : number) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Adjust scores for single mode
 * @param {number} playerA - Current rating of player A
 * @param {number} playerB - Current rating of player B
 * @param {number} scoreA - Score of player A
 * @param {number} scoreB - Score of player B
 * @param {number} [K=30] - K-factor
 * @returns {object} - New ratings for player A and player B
 */
export async function singleMode(playerA : number, playerB : number, scoreA : number, scoreB : number, K = 30) {
    const probA = calculateProbability(playerA, playerB);
    const probB = calculateProbability(playerB, playerA);

    const resultA = scoreA > scoreB ? 1 : 0;
    const resultB = scoreB > scoreA ? 1 : 0;

    const scoreDiff = Math.abs(scoreA - scoreB);
    const F = Math.round(1 + scoreDiff / 21); // Score difference factor, rounded to integer

    const deltaA = Math.round(F * K * (resultA - probA));
    const deltaB = Math.round(F * K * (resultB - probB));

    return {
        playerADelta: deltaA,
        playerBDelta: deltaB,
    };
}

/**
 * Adjust scores for double mode
 * @param {Array<number>} teamA - Current ratings of team A [player1, player2]
 * @param {Array<number>} teamB - Current ratings of team B [player1, player2]
 * @param {number} scoreA - Score of team A
 * @param {number} scoreB - Score of team B
 * @param {number} [K=30] - K-factor
 * @param {number} [teamARating=0] - Current rating of team A as a double team
 * @param {number} [teamBRating=0] - Current rating of team B as a double team
 * @returns {object} - New ratings for both teams
 */
export async function doubleMode(teamA: number[], teamB: number[], scoreA: number, scoreB : number, teamARating = 0, teamBRating = 0, K = 30) {
    if (!teamA || teamA.length !== 2 || !teamB || teamB.length !== 2) {
        throw new Error("Both teamA and teamB must be arrays with exactly two players.");
    }

    const x = teamA[1] ?? 0;
    const y = teamB[1] ?? 0;

    const avgA = Math.round((teamA[0] ?? 0 + x) / 2);
    const avgB = Math.round((teamB[0] ?? 0 + y) / 2);

    const effectiveRatingA = teamARating > 0 ? Math.round((teamARating + avgA) / 2) : avgA;
    const effectiveRatingB = teamBRating > 0 ? Math.round((teamBRating + avgB) / 2) : avgB;

    const probA = calculateProbability(effectiveRatingA, effectiveRatingB);
    const probB = calculateProbability(effectiveRatingB, effectiveRatingA);

    const resultA = scoreA > scoreB ? 1 : 0;
    const resultB = scoreB > scoreA ? 1 : 0;

    const scoreDiff = Math.abs(scoreA - scoreB);
    const F = Math.round(1 + scoreDiff / 21); // Score difference factor, rounded to integer

    const deltaA = Math.round(F * K * (resultA - probA));
    console.log("deltaA", deltaA)
    const deltaB = Math.round(F * K * (resultB - probB));
    console.log("deltaB", deltaB)
    return {
        teamADelta: [
            deltaA,
            deltaA,
        ],
        teamBDelta: [
            deltaB,
            deltaB,
        ],
        teamARatingDelta: deltaA,
        teamBRatingDelta: deltaB
    };
}

export async function updateSingleRank(userId: string, points: number) {
  const currentSingleRank = await prisma.singleRank.findFirst({
    where: {  userId },
    select: { score: true },
  });

  if (currentSingleRank) {
    const newScore = points;
    await prisma.singleRank.updateMany({
      where: { userId },
      data: { score: newScore },
    });
  }
}

export async function updateDoubleRank(partnershipId: string, points: number) {
  const currentDoubleRank = await prisma.doubleRank.findFirst({
    where: { partnershipId },
    select: { score: true },
  });

  if (currentDoubleRank) {
    const newScore = points;
    await prisma.doubleRank.updateMany({
      where: { partnershipId },
      data: { score: newScore },
    });
  }
}
