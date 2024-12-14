'use server';

import { prisma } from '~/server/prisma';

export async function DoublePlayerRankings() {
  const ranks = await prisma.doubleRank.findMany({
    take: 10,
    orderBy: { rank: 'asc' },
    include: {
      partnership: {
        include: {
          player1: true,
          player2: true,
        },
      },
    },
  });

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-3xl font-bold text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
          </svg>
          Double Player Rankings
        </h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-pin-rows">
            <thead>
              <tr className="text-base text-base-content">
                <th>Rank</th>
                <th>Team</th>
                <th>Score</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((rank, index) => (
                <tr key={rank.id} className="hover:bg-base-200 transition-colors">
                  <td>
                    <div className={`badge ${
                      index === 0 ? 'badge-primary' : 
                      index === 1 ? 'badge-secondary' : 
                      index === 2 ? 'badge-accent' : 
                      'badge-ghost'
                    } badge-lg`}>
                      {rank.rank}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-4">
                      {/* Partnership Nickname */}
                      <div className="flex flex-col">
                        {rank.partnership.nickname ? (
                          <>
                            <div className="font-bold text-lg text-primary">
                              {rank.partnership.nickname}
                            </div>
                            <div className="text-sm text-base-content/70">
                              {rank.partnership.player1.nickname ?? rank.partnership.player1.name} 
                              {' & '}
                              {rank.partnership.player2.nickname ?? rank.partnership.player2.name}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center space-x-4">
                            {/* Player 1 */}
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12">
                                  <img 
                                    src={rank.partnership.player1.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                                    alt={`${rank.partnership.player1.name}'s avatar`} 
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-base">{rank.partnership.player1.nickname ?? rank.partnership.player1.name}</div>
                                {rank.partnership.player1.nickname && (
                                  <div className="text-sm text-base-content/70">
                                    {rank.partnership.player1.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="font-bold text-lg text-base-content/50">&</div>
                            {/* Player 2 */}
                            <div className="flex items-center space-x-3">
                              <div className="avatar">
                                <div className="mask mask-squircle w-12 h-12">
                                  <img 
                                    src={rank.partnership.player2.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                                    alt={`${rank.partnership.player2.name}'s avatar`} 
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-bold text-base">{rank.partnership.player2.nickname ?? rank.partnership.player2.name}</div>
                                {rank.partnership.player2.nickname && (
                                  <div className="text-sm text-base-content/70">
                                    {rank.partnership.player2.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-outline badge-lg text-base-content">{rank.score}</div>
                  </td>
                  <td className="text-base-content/70">{new Date(rank.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
