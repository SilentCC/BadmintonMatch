'use server';

import { prisma } from '~/server/prisma';

export async function SinglePlayerRankings() {
  const ranks = await prisma.singleRank.findMany({
    orderBy: {
      score: 'desc'
    },
    include: {
      user: true
    }
  });

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-3xl font-bold text-primary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Single Player Rankings
        </h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra table-pin-rows">
            <thead>
              <tr className="text-base text-base-content">
                <th>Rank</th>
                <th>Player</th>
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
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center space-x-4">
                      <div className="avatar">
                        <div className="mask mask-squircle w-12 h-12">
                          <img 
                            src={rank.user.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                            alt={`${rank.user.name}'s avatar`} 
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-base">{rank.user.nickname ?? rank.user.name}</div>
                        {rank.user.nickname && (
                          <div className="text-sm text-base-content/70">
                            {rank.user.name}
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
