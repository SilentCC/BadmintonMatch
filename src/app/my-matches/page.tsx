import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../server/prisma";
import MatchCard from '../../components/MatchView';
import React from 'react'
import { MatchWithRelations } from '../../components/MatchView';

export default async function MyMatchesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get matches from the last month where the user is involved
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const matches: MatchWithRelations[] = await prisma.match.findMany({
    where: {
      createdAt: {
        gte: oneMonthAgo
      },
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id },
        {
          partnership1: {
            OR: [
              { player1Id: session.user.id },
              { player2Id: session.user.id }
            ]
          }
        },
        {
          partnership2: {
            OR: [
              { player1Id: session.user.id },
              { player2Id: session.user.id }
            ]
          }
        }
      ]
    },
    include: {
      player1: true,
      player2: true,
      partnership1: {
        include: {
          player1: true,
          player2: true
        }
      },
      partnership2: {
        include: {
          player1: true,
          player2: true
        }
      },
      rounds: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const isAdmin = session?.user?.name === 'yongkang'

  const doublesMatches = matches.filter(match => match.type === 'DOUBLES');
  const singlesMatches = matches.filter(match => match.type === 'SINGLES');

  return(
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Matches</h1>
      </div>

      {/* Doubles Matches */}
      {doublesMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Doubles Matches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doublesMatches.map((match) => (
              <MatchCard key={match.id} match={match} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {/* Singles Matches */}
      {singlesMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Singles Matches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {singlesMatches.map((match) => (
              <MatchCard key={match.id} match={match} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No matches found in the last month
        </div>
      )};
      </div>
    );
}