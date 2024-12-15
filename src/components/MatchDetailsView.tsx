'use client';

import { useState } from 'react';
import { updateMatchRound, addMatchRound } from '~/server/matchActions';
import { MatchType, MatchRound } from '@prisma/client';
import Link from 'next/link';
import { toast } from 'sonner';

// Utility function for consistent date formatting
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

type MatchWithRelations = {
  id: string;
  type: MatchType;
  createdAt: Date;
  player1?: { id: string; name: string | null; nickname?: string | null; image?: string | null } | null;
  player2?: { id: string; name: string | null; nickname?: string | null; image?: string | null } | null;
  partnership1?: { 
    player1: { id: string; name: string | null; nickname?: string | null; image?: string | null };
    player2: { id: string; name: string | null; nickname?: string | null; image?: string | null };
    nickname?: string | null;
  } | null;
  partnership2?: { 
    player1: { id: string; name: string | null; nickname?: string | null; image?: string | null };
    player2: { id: string; name: string | null; nickname?: string | null; image?: string | null };
    nickname?: string | null;
  } | null;
  rounds: MatchRound[];
};

type MatchDetailsViewProps = {
  match: MatchWithRelations;
  isParticipant: boolean;
  currentUserId?: string;
};

const NewRoundInput: React.FC<{
  roundNumber: number;
  onAddRound: (score1: number, score2: number) => void;
}> = ({ onAddRound }) => {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSaveRound = () => {
    // Validate scores
    if (score1 < 0 || score1 > 21 || score2 < 0 || score2 > 21) {
      setError("Scores must be between 0 and 21");
      return;
    }

    setError(null);

    // Add the round
    onAddRound(score1, score2);
    
    // Reset scores after adding
    setScore1(0);
    setScore2(0);
  };

  const handleScore1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const score = Number(e.target.value);
    setScore1(Math.min(Math.max(score, 0), 21));
  };

  const handleScore2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const score = Number(e.target.value);
    setScore2(Math.min(Math.max(score, 0), 21));
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <input 
          type="number" 
          value={score1} 
          onChange={handleScore1Change}
          className="input input-bordered input-sm w-20" 
          min="0" 
          max="21"
        />
        <span>:</span>
        <input 
          type="number" 
          value={score2} 
          onChange={handleScore2Change}
          className="input input-bordered input-sm w-20" 
          min="0" 
          max="21"
        />
        <button 
          className="btn btn-sm btn-primary" 
          onClick={handleSaveRound}
        >
          Add Round
        </button>
      </div>
      {error && <p className="text-error">{error}</p>}
    </div>
  );
};

export default function MatchDetailsView({ 
  match, 
  isParticipant,
  currentUserId,
}: MatchDetailsViewProps) {
  const [rounds, setRounds] = useState(match.rounds);
  const [editingRound, setEditingRound] = useState<MatchRound | null>(null);
  const [isAddingNewRound, setIsAddingNewRound] = useState(false);

  const userCanAddRound = match.type === 'SINGLES' 
    ? [match.player1?.id, match.player2?.id].includes(currentUserId ?? '')
    : [
        match.partnership1?.player1.id, 
        match.partnership1?.player2.id,
        match.partnership2?.player1.id, 
        match.partnership2?.player2.id
      ].includes(currentUserId ?? '');

  const handleUpdateRound = async (roundId: string, score1: number, score2: number) => {
    try {
      const updatedRound = await updateMatchRound(roundId, score1, score2);
      setRounds(prevRounds => 
        prevRounds.map(round => round.id === roundId ? updatedRound : round)
      );
      setEditingRound(null);
    } catch (error) {
      console.error('Failed to update round', error);
      toast.error('Failed to update round');
    }
  };

  const handleAddNewRound = async (score1: number, score2: number) => {
    try {
      const newRound = await addMatchRound(match.id, score1, score2);
      
      // Update local state by adding the new round to the existing rounds
      setRounds(prevRounds => [...prevRounds, newRound]);
      setIsAddingNewRound(false);
    } catch (error) {
      console.error('Failed to add round:', error);
      toast.error('Failed to add round');
    }
  };

  const renderPlayerOrPartnership = (type: 'player1' | 'player2' | 'partnership1' | 'partnership2') => {
    console.log('Rendering type:', type);
    console.log('Match type:', match.type);

    // Map the input type to the correct object key
    const entityKey = match.type === 'SINGLES' 
      ? (type === 'player1' || type === 'player2' ? type : null)
      : (type === 'partnership1' || type === 'partnership2' ? type : null);

    console.log('Entity key:', entityKey);

    const entity = entityKey ? match[entityKey] : null;
    console.log('Entity:', JSON.stringify(entity, null, 2));

    if (match.type === 'SINGLES') {
      const player = entity as { id: string; name: string | null; nickname?: string | null; image?: string | null };
      return player?.name ? (
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="mask mask-squircle w-12 h-12">
              <img 
                src={player.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                alt={`${player.name}'s avatar`} 
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <div className="font-bold">{player.nickname ?? player.name}</div>
            {player.nickname && <div className="text-sm text-gray-500">{player.name}</div>}
          </div>
        </div>
      ) : null;
    } else {
      // Defensive check to ensure entity exists and has the correct structure
      if (!entity || typeof entity !== 'object') {
        console.error(`Invalid entity for type ${type}:`, entity);
        return null;
      }

      // Type assertion with more flexible typing
      const partnership = entity as { 
        player1?: { id: string; name?: string; nickname?: string; image?: string };
        player2?: { id: string; name?: string; nickname?: string; image?: string };
        nickname?: string;
      };

      console.log('Partnership details:', {
        player1: partnership.player1,
        player2: partnership.player2,
        nickname: partnership.nickname
      });

      // If either player is missing, return null
      if (!partnership.player1 || !partnership.player2) {
        console.error('Missing player1 or player2 in partnership');
        return null;
      }

      return (
        <div className="flex items-center space-x-3">
          <div className="avatar-group -space-x-3">
            <div className="avatar">
              <div className="mask mask-squircle w-12 h-12">
                <img 
                  src={partnership.player1.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                  alt={`${partnership.player1.name}'s avatar`} 
                  className="object-cover"
                />
              </div>
            </div>
            <div className="avatar">
              <div className="mask mask-squircle w-12 h-12">
                <img 
                  src={partnership.player2.image ?? 'https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp'} 
                  alt={`${partnership.player2.name}'s avatar`} 
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          <div>
            <div className="font-bold">
              {partnership.nickname ?? 
               `${partnership.player1.nickname ?? partnership.player1.name} & 
                ${partnership.player2.nickname ?? partnership.player2.name}`}
            </div>
            <div className="text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>{partnership.player1.nickname ?? partnership.player1.name}</span>
                <span className="text-xs">•</span>
                <span>{partnership.player2.nickname ?? partnership.player2.name}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderScoreColumn = (round: MatchRound, isEditing: boolean) => {
    if (match.type === 'SINGLES') {
      return (
        <>
          <td>
            {isEditing ? (
              <input 
                type="number" 
                defaultValue={round.player1Score ?? 0} 
                className="input input-bordered input-sm w-20"
                onChange={(e) => setEditingRound(prev => 
                  prev ? {
                    ...prev, 
                    player1Score: Number(e.target.value)
                  } : null
                )}
              />
            ) : (
              round.player1Score
            )}
          </td>
          <td>
            {isEditing ? (
              <input 
                type="number" 
                defaultValue={round.player2Score ?? 0} 
                className="input input-bordered input-sm w-20"
                onChange={(e) => setEditingRound(prev => 
                  prev ? {
                    ...prev, 
                    player2Score: Number(e.target.value)
                  } : null
                )}
              />
            ) : (
              round.player2Score
            )}
          </td>
        </>
      );
    } else {
      return (
        <>
          <td>
            {isEditing ? (
              <input 
                type="number" 
                defaultValue={round.partnership1Score ?? 0} 
                className="input input-bordered input-sm w-20"
                onChange={(e) => setEditingRound(prev => 
                  prev ? {
                    ...prev, 
                    partnership1Score: Number(e.target.value)
                  } : null
                )}
              />
            ) : (
              round.partnership1Score
            )}
          </td>
          <td>
            {isEditing ? (
              <input 
                type="number" 
                defaultValue={round.partnership2Score ?? 0} 
                className="input input-bordered input-sm w-20"
                onChange={(e) => setEditingRound(prev => 
                  prev ? {
                    ...prev, 
                    partnership2Score: Number(e.target.value)
                  } : null
                )}
              />
            ) : (
              round.partnership2Score
            )}
          </td>
        </>
      );
    }
  };

  const handleSaveEditedRound = () => {
    if (!editingRound) return;

    const score1 = match.type === 'SINGLES' 
      ? (editingRound.player1Score ?? 0)
      : (editingRound.partnership1Score ?? 0);
    
    const score2 = match.type === 'SINGLES'
      ? (editingRound.player2Score ?? 0)
      : (editingRound.partnership2Score ?? 0);

    handleUpdateRound(editingRound.id, score1, score2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Match Details</h2>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm text-gray-500">
                  {formatDate(match.createdAt)}
                </span>
                <span className="ml-2 text-sm uppercase text-gray-600">
                  {match.type}
                </span>
              </div>
              <Link href="/matches" className="btn btn-sm btn-outline">
                Back to Matches
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Team 1</h3>
                {renderPlayerOrPartnership(
                  match.type === 'SINGLES' ? 'player1' : 'partnership1'
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Team 2</h3>
                {renderPlayerOrPartnership(
                  match.type === 'SINGLES' ? 'player2' : 'partnership2'
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Score 1</th>
                    <th>Score 2</th>
                    {isParticipant && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {rounds.map((round, index) => (
                    <tr key={round.id}>
                      <td>{index + 1}</td>
                      {renderScoreColumn(round, editingRound?.id === round.id)}
                      {isParticipant && (
                        <td>
                          {editingRound?.id === round.id ? (
                            <div className="flex space-x-2">
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={handleSaveEditedRound}
                              >
                                Save
                              </button>
                              <button 
                                className="btn btn-sm btn-ghost"
                                onClick={() => setEditingRound(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-sm btn-outline"
                              onClick={() => setEditingRound(round)}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {isParticipant && userCanAddRound && isAddingNewRound && (
                    <NewRoundInput 
                      roundNumber={rounds.length + 1} 
                      onAddRound={handleAddNewRound} 
                    />
                  )}
                  {isParticipant && userCanAddRound && !isAddingNewRound && (
                    <tr>
                      <td colSpan={4}>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => setIsAddingNewRound(true)}
                        >
                          Add New Round
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
