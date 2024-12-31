'use client'

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';

export default function RefreshStatsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [result, setResult] = useState<string>('');

  // This should be an environment variable in production
  const ADMIN_PASSWORD = '123';

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthorized(true);
    }
  };

  const { data: users } = trpc.user.list.useQuery();
  const updateStats = trpc.playerStats.updateStats.useMutation();

  const handleRefresh = async () => {
    if (!users) return;

    setIsLoading(true);
    setResult('');
    try {
      let successCount = 0;

      for (const user of users) {
        try {
          updateStats.mutate({ playerId: user.id });
          successCount++;
        } catch (error) {
          console.error(`Failed to update stats for user ${user.id}:`, error);
        }
      }

      setResult(`Successfully updated stats for ${successCount} out of ${users.length} users`);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      setResult('Error: Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <form onSubmit={handleAuth} className="card bg-base-100 shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-4">Admin Authentication</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="input input-bordered mb-4"
          />
          <button type="submit" className="btn btn-primary">
            Authenticate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-base-200">
      <div className="card bg-base-100 shadow-xl p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin: Refresh Player Stats</h1>

        <button
          onClick={handleRefresh}
          disabled={isLoading || !users}
          className="btn btn-primary mb-4"
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              Refreshing Stats...
            </>
          ) : (
            'Refresh All Player Stats'
          )}
        </button>

        {result && (
          <div className={`alert ${result.includes('Error') ? 'alert-error' : 'alert-success'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}