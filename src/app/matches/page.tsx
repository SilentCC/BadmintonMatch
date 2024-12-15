import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { prisma } from "~/server/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

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

  const matches: MatchWithRelations[] = await prisma.match.findMany({
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

  // Determine match status based on rounds
  const categorizedMatches: Record<string, MatchWithRelations[]> = matches.reduce((acc, match) => {
    const isOpen = match.rounds.length === 0;
    const matchCategory = `${match.type.toLowerCase()}${isOpen ? 'Open' : 'Closed'}Matches`;
    
    if (!acc[matchCategory]) {
      acc[matchCategory] = [];
    }
    acc[matchCategory].push(match);
    
    return acc;
  }, {} as Record<string, MatchWithRelations[]>);

  return (
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
      
      {Object.entries(categorizedMatches).map(([category, categoryMatches]) => (
        <div key={category} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 capitalize">
            {category.replace(/([A-Z])/g, ' $1').trim()}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryMatches.map((match) => (
              <div 
                key={match.id} 
                className={`bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow w-full
                  ${(match.type === 'DOUBLES' || match.type === 'SINGLES') && match.rounds.length === 0 
                    ? 'flex flex-col items-center text-center space-y-2 md:space-y-4 ' +
                      'border border-blue-100 bg-blue-50/10 ' +
                      'transform hover:scale-105 active:scale-100 ' +
                      'transition-all duration-300 ease-in-out ' +
                      'focus:outline-none focus:ring-2 focus:ring-blue-200'
                    : ''}`}
              >
                {(match.type === 'DOUBLES' || match.type === 'SINGLES') && match.rounds.length === 0 && (
                  <div className="w-full flex justify-center mb-2">
                    <span className="badge badge-primary badge-outline">
                      Open Match
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {new Date(match.matchDate).toLocaleDateString()}
                  </span>
                  <span className="text-sm uppercase text-gray-600">
                    {match.type}
                  </span>
                </div>
                
                {match.type === 'SINGLES' ? (
                  <div className="flex items-center justify-between w-full space-x-4">
                    {match.player1 && (
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="avatar shrink-0">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.player1.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.player1.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-base truncate">
                            {match.player1.nickname ?? match.player1.name}
                          </div>
                          {match.player1.nickname && (
                            <div className="text-sm text-base-content/70 truncate">
                              {match.player1.name}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="font-bold text-lg text-base-content/50">vs</div>
                    {match.player2 && (
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="avatar shrink-0">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.player2.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.player2.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-base truncate">
                            {match.player2.nickname ?? match.player2.name}
                          </div>
                          {match.player2.nickname && (
                            <div className="text-sm text-base-content/70 truncate">
                              {match.player2.name}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full space-x-4">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="avatar-group -space-x-3 shrink-0">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.partnership1?.player1.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.partnership1?.player1.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.partnership1?.player2.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.partnership1?.player2.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold truncate">
                          {match.partnership1?.nickname ?? 
                           `${match.partnership1?.player1.nickname ?? match.partnership1?.player1.name} & 
                            ${match.partnership1?.player2.nickname ?? match.partnership1?.player2.name}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {match.partnership1?.player1.nickname ?? match.partnership1?.player1.name} 
                          {' & '}
                          {match.partnership1?.player2.nickname ?? match.partnership1?.player2.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg text-base-content/50 font-bold">vs</div>
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="avatar-group -space-x-3 shrink-0">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.partnership2?.player1.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.partnership2?.player1.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img 
                              src={match.partnership2?.player2.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                              alt={`${match.partnership2?.player2.name}'s avatar`} 
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold truncate">
                          {match.partnership2?.nickname ?? 
                           `${match.partnership2?.player1.nickname ?? match.partnership2?.player1.name} & 
                            ${match.partnership2?.player2.nickname ?? match.partnership2?.player2.name}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {match.partnership2?.player1.nickname ?? match.partnership2?.player1.name} 
                          {' & '}
                          {match.partnership2?.player2.nickname ?? match.partnership2?.player2.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-sm text-gray-600">
                  {match.rounds.length > 0 ? (
                    `${match.rounds.length} round(s) played`
                  ) : (
                    <span className="text-yellow-600">Open Match</span>
                  )}
                </div>
                
                <Link 
                  href={`/matches/${match.id}`} 
                  className="mt-4 block w-full text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {Object.keys(categorizedMatches).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No matches found
        </div>
      )}
    </div>
  );
}
