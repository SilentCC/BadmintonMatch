'use client';

import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? '123';

export default function RefreshStarsPage() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const updateStars = trpc.yearStars.updateLastYearStars.useMutation({
    onSuccess: () => {
      setStatus('success');
      setError(null);
    },
    onError: (err) => {
      setStatus('error');
      setError(err.message);
    }
  });

  const handleRefresh = async () => {
    setStatus('loading');
    setError(null);
    try {
        updateStars.mutate({ year });
    } catch (err) {
      // Error is handled by onError above
    }
  };

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-4">Admin Authorization Required</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Admin Password</span>
              </label>
              <input
                type="password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && password === ADMIN_PASSWORD) {
                    setIsAuthorized(true);
                  }
                }}
              />
            </div>
            <button
              className="btn btn-primary mt-4"
              onClick={() => {
                if (password === ADMIN_PASSWORD) {
                  setIsAuthorized(true);
                }
              }}
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold mb-4">Refresh Stars of the Year</h2>

          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Select Year</span>
            </label>
            <select
              className="select select-bordered"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <button
              className={`btn btn-primary ${status === 'loading' ? 'loading' : ''}`}
              onClick={handleRefresh}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Refreshing...' : 'Refresh Stars'}
            </button>

            {status === 'success' && (
              <div className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Stars have been refreshed successfully!</span>
              </div>
            )}

            {status === 'error' && error && (
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Error: {error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}