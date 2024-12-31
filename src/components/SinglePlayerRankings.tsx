'use server';

import { prisma } from '~/server/prisma';
import { RankingRow } from './RankingRow';

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
                <RankingRow
                  key={rank.id}
                  rank={rank}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
