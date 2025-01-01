'use client'

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { Trophy } from 'lucide-react';

interface YearStarsHistoryProps {
  years: number[];
  yearStars: {
    id: string;
    year: number;
    rank: number;
    score: number;
    user: {
      id: string;
      name: string | null;
      nickname: string | null;
      image: string | null;
    };
  }[];
}

export function YearStarsHistory({ years, yearStars }: YearStarsHistoryProps) {
  const medalStyles = {
    1: 'bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 border border-yellow-200',
    2: 'bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100 border border-gray-200',
    3: 'bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-amber-200'
  };

  const trophyColors = {
    1: 'text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]',
    2: 'text-gray-400 drop-shadow-[0_0_4px_rgba(156,163,175,0.4)]',
    3: 'text-amber-600 drop-shadow-[0_0_4px_rgba(180,83,9,0.4)]'
  };

  const trophySizes = {
    1: 'w-16 h-16',
    2: 'w-14 h-14',
    3: 'w-12 h-12'
  };

  const defaultAvatar = 'https://cs110032000d3024da4.blob.core.windows.net/avatars/badmintonplayer.png';

  return (
    <div className="space-y-8">
      {years.map(year => {
        const starsForYear = yearStars.filter(star => star.year === year);

        return (
          <div key={year} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Stars of {year}
              </h2>

              {starsForYear.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  {starsForYear.map((star) => (
                    <div
                      key={star.id}
                      className={`flex items-center gap-5 p-5 rounded-lg transition-all duration-300 ${medalStyles[star.rank as 1 | 2 | 3]}`}
                    >
                      <div className="flex items-center justify-center w-16 h-16">
                        <EmojiEventsIcon
                          className={`${trophyColors[star.rank as 1 | 2 | 3]} ${trophySizes[star.rank as 1 | 2 | 3]} transition-transform hover:scale-110`}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12">
                            <img
                              src={star.user.image ?? defaultAvatar}
                              alt={star.user.name ?? 'Player avatar'}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-lg">
                            {star.user.nickname ?? star.user.name}
                          </div>
                          <div className="text-base opacity-70">
                            Score: {star.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No stars recorded for {year}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}