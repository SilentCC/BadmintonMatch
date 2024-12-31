'use client';

import { createContext, useContext, useState } from 'react';
import { RankingRow } from './RankingRow';

// Create context for active stats
const ActiveStatsContext = createContext<{
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}>({
  activeId: null,
  setActiveId: () => void 0,
});

// Hook to use the stats context
export const useActiveStats = () => useContext(ActiveStatsContext);

interface RankingsTableWrapperProps {
  rankings: {
    id: string;
    score: number;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      nickname: string | null;
      image: string | null;
    };
  }[];
}

export function RankingsTableWrapper({ rankings }: RankingsTableWrapperProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <ActiveStatsContext.Provider value={{ activeId, setActiveId }}>
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
          {rankings.map((rank, index) => (
            <RankingRow
              key={rank.id}
              rank={rank}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </ActiveStatsContext.Provider>
  );
}