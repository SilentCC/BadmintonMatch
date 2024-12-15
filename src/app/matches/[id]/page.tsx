import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { prisma } from "~/server/prisma";
import MatchDetailsView from "~/components/MatchDetailsView";
import { Metadata } from "next";

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
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
      }
    }
  });

  if (!match) {
    return {
      title: "Match Not Found",
      description: "The requested match could not be found."
    };
  }

  const getMatchTitle = () => {
    if (match.type === 'SINGLES') {
      return `${match.player1?.nickname ?? match.player1?.name} vs ${match.player2?.nickname ?? match.player2?.name}`;
    } else {
      const team1 = match.partnership1 
        ? `${match.partnership1.player1.nickname ?? match.partnership1.player1.name} & ${match.partnership1.player2.nickname ?? match.partnership1.player2.name}` 
        : 'Team 1';
      const team2 = match.partnership2 
        ? `${match.partnership2.player1.nickname ?? match.partnership2.player1.name} & ${match.partnership2.player2.nickname ?? match.partnership2.player2.name}` 
        : 'Team 2';
      return `${team1} vs ${team2}`;
    }
  };

  return {
    title: `Match: ${getMatchTitle()}`,
    description: `Details of ${match.type} match between players`
  };
}

export default async function MatchDetailsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
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
      rounds: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  if (!match) {
    redirect("/matches");
  }

  // Determine if current user is a participant
  const isParticipant = match.type === 'SINGLES' 
    ? [match.player1Id, match.player2Id].includes(session.user.id)
    : [
        match.partnership1?.player1Id, 
        match.partnership1?.player2Id,
        match.partnership2?.player1Id, 
        match.partnership2?.player2Id
      ].includes(session.user.id);

  return (
    <MatchDetailsView 
      match={match} 
      isParticipant={isParticipant}
      currentUserId={session.user.id}
    />
  );
}
