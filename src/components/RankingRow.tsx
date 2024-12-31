'use client';

import { useState } from 'react';
import { PlayerStatsTooltip } from './PlayerStatsTooltip';

interface RankingRowProps {
  rank: {
    id: string;
    score: number;
    updatedAt: Date;
    user: {
      id: string;
      name: string | null;
      nickname: string | null;
      image: string | null;
    };
  };
  index: number;
}

export function RankingRow({ rank, index }: RankingRowProps) {
  const [showStats, setShowStats] = useState(false);

  // Format date consistently using Intl.DateTimeFormat
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(rank.updatedAt));

  return (
    <tr
      className="hover:bg-base-200 transition-colors relative cursor-pointer"
      onClick={() => setShowStats(!showStats)}
    >
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
          <div className="relative">
            <div className="font-bold text-base">{rank.user.nickname ?? rank.user.name}</div>
            {rank.user.nickname && (
              <div className="text-sm text-base-content/70">
                {rank.user.name}
              </div>
            )}
            {showStats && (
              <PlayerStatsTooltip
                userId={rank.user.id}
                isVisible={showStats}
              />
            )}
          </div>
        </div>
      </td>
      <td>
        <div className="badge badge-outline badge-lg text-base-content">{rank.score}</div>
      </td>
      <td className="text-base-content/70">{formattedDate}</td>
    </tr>
  );
}