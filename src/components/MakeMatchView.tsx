import { Match, User, Partnership } from "@prisma/client";
import Link from "next/link";

interface MatchWithRelations extends Match {
  player1?: User;
  player2?: User;
  partnership1?: Partnership & {
    player1: User;
    player2: User;
  };
  partnership2?: Partnership & {
    player1: User;
    player2: User;
  };
  rounds?: { id: string }[];
}

export default function MakeMatchView({ match }: { match: MatchWithRelations }) {
  const defaultAvatar = 'https://cs110032000d3024da4.blob.core.windows.net/avatars/badmintonplayer.png';
  return (
    <div
      key={match.id}
      className={`bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow
        ${match.closed
          ? 'bg-gray-100 opacity-75'
          : (match.type === 'DOUBLES' || match.type === 'SINGLES')
            ? 'border border-blue-100 bg-blue-50/10 transform hover:scale-105 active:scale-100'
            : ''
        }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {new Date(match.createdAt).toLocaleDateString()}
          </span>
          {match.closed ? (
            <span className="badge badge-ghost">Closed</span>
          ) : (
            <span className="badge badge-primary badge-outline">Open</span>
          )}
        </div>
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
                    src={match.player1.image ?? defaultAvatar}
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
                    src={match.player2.image ?? defaultAvatar}
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
                    src={match.partnership1?.player1.image ?? defaultAvatar}
                    alt={`${match.partnership1?.player1.name}'s avatar`}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="avatar">
                <div className="mask mask-squircle w-12 h-12">
                  <img
                    src={match.partnership1?.player2.image ?? defaultAvatar}
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
                    src={match.partnership2?.player1.image ?? defaultAvatar}
                    alt={`${match.partnership2?.player1.name}'s avatar`}
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="avatar">
                <div className="mask mask-squircle w-12 h-12">
                  <img
                    src={match.partnership2?.player2.image ?? defaultAvatar}
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
        {match.rounds && match.rounds.length > 0 ? (
          `${match.rounds.length} round(s) played`
        ) : (
          <span className={match.closed ? "text-gray-600" : "text-yellow-600"}>
            {match.closed ? "No rounds played" : "Open Match"}
          </span>
        )}
      </div>

      <Link
        href={`/matches/${match.id}`}
        className={`mt-4 block w-full text-center py-2 rounded transition-colors
          ${match.closed
            ? 'bg-gray-400 hover:bg-gray-500 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
      >
        View Details
      </Link>
    </div>
  );
}