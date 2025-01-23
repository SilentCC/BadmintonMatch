import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { prisma } from "~/server/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import MatchCard from "../../components/MatchView";

type MatchWithRelations = Prisma.MatchGetPayload<{
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
  }
}>;

export default async function MatchesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.name === 'yongkang';

  // Get matches from the last month
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  console.time("GetPartnerships");
  const matches: MatchWithRelations[] = await prisma.match.findMany({
    where: {
      createdAt: {
        gte: twoWeeksAgo
      }
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

  console.timeEnd("GetPartnerships");

  // Separate matches by type
  const doublesMatches = matches.filter(match => match.type === 'DOUBLES');
  const singlesMatches = matches.filter(match => match.type === 'SINGLES');

  console.time("RenderHtml");
  const html = (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Matches</h1>
        <Link
          href="/matches/create"
          className="btn btn-primary"
        >
          Create New Match
        </Link>
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
      )}
    </div>
  );
  console.timeEnd("RenderHtml");
  return html;
}
