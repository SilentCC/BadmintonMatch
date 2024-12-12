'use client';

import { trpc } from '~/utils/trpc';

export function SinglePlayerRankings() {
  const singleRankQuery = trpc.rank.listSingle.useInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor;
      },
    },
  );

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-4">Single Player Rankings</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {singleRankQuery.data?.pages.flatMap((page) =>
                page.items.map((rank) => (
                  <tr key={rank.id}>
                    <td>
                      <div className="badge badge-primary">{rank.rank}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle h-12 w-12">
                            <img
                              src={rank.user.image ?? 'https://img.daisyui.com/images/profile/demo/2@94.webp'}
                              alt={`${rank.user.name}'s avatar`}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{rank.user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="badge badge-accent badge-lg">{rank.score}</div>
                    </td>
                    <td>{new Date(rank.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {singleRankQuery.hasNextPage && (
            <div className="flex justify-center mt-4">
              <button
                className="btn btn-primary"
                onClick={() => singleRankQuery.fetchNextPage()}
                disabled={singleRankQuery.isFetchingNextPage}
              >
                {singleRankQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
