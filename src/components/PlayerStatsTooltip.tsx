'use client'

import { trpc } from '~/app/_trpc/client';
import { Trophy, Target, Award, Loader2 } from 'lucide-react';

interface PlayerStatsTooltipProps {
  userId: string;
  isVisible: boolean;
}

export function PlayerStatsTooltip({ userId, isVisible }: PlayerStatsTooltipProps) {
  const { data: playerStats, isLoading } = trpc.playerStats.getStats.useQuery({ playerId: userId });

  if (!isVisible) return null;

  return (
    <div className="absolute -right-[240px] top-0 z-10 animate-in fade-in slide-in-from-right-5 duration-200">
      <div className="bg-base-100 shadow-lg rounded-lg p-4 min-w-[220px] border border-base-200">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="font-bold">Player Stats</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Total Matches */}
            <div className="flex items-center justify-between bg-base-200/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm">Total</span>
              </div>
              <span className="font-bold">{playerStats?.totalMatches ?? '-'}</span>
            </div>

            {/* Win/Loss Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-success/10 rounded-lg px-3 py-2">
                <div className="text-xs text-success-content/70">Won</div>
                <div className="font-bold text-success">{playerStats?.wonMatches ?? '-'}</div>
              </div>
              <div className="bg-error/10 rounded-lg px-3 py-2">
                <div className="text-xs text-error-content/70">Lost</div>
                <div className="font-bold text-error">{playerStats?.lostMatches ?? '-'}</div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-primary/5 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-primary-content/70">Win Rate</span>
                </div>
                <span className="font-bold text-primary">{playerStats?.winPercentage ?? '-'}%</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${playerStats?.winPercentage ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}