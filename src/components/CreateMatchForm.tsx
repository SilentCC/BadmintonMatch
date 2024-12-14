import { prisma } from "~/server/prisma";
import { MatchType } from "@prisma/client";
import { redirect } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  nickname: string | null;
};

type Partnership = {
  id: string;
  player1: User;
  player2: User;
  nickname: string | null;
};

type CreateMatchFormProps = {
  users: User[];
  partnerships: Partnership[];
};

export default async function CreateMatchForm({ 
  users, 
  partnerships 
}: CreateMatchFormProps) {
  const handleSubmit = async (formData: FormData) => {
    'use server';

    const matchType = formData.get('matchType') as MatchType;
    const player1Id = formData.get('player1Id') as string | null;
    const player2Id = formData.get('player2Id') as string | null;
    const partnership1Id = formData.get('partnership1Id') as string | null;
    const partnership2Id = formData.get('partnership2Id') as string | null;
    const tournamentName = formData.get('tournamentName') as string | null;
    const eventName = formData.get('eventName') as string | null;
    const location = formData.get('location') as string | null;

    try {
      await prisma.match.create({
        data: {
          type: matchType,
          player1Id: matchType === 'SINGLES' ? player1Id : null,
          player2Id: matchType === 'SINGLES' ? player2Id : null,
          partnership1Id: matchType === 'DOUBLES' ? partnership1Id : null,
          partnership2Id: matchType === 'DOUBLES' ? partnership2Id : null,
          tournamentName,
          eventName,
          location,
          matchDate: new Date(),
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to create match:', error);
      return { success: false, error: 'Failed to create match' };
    } finally {
      redirect('/matches');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Create New Match</h2>
            <form action={handleSubmit} className="space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Match Type</span>
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="matchType"
                      value="SINGLES"
                      required
                      className="radio radio-primary mr-2"
                    />
                    <span>Singles</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="matchType"
                      value="DOUBLES"
                      required
                      className="radio radio-primary mr-2"
                    />
                    <span>Doubles</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Player/Partnership 1</span>
                  </label>
                  <select
                    name="player1Id"
                    required
                    className="select select-bordered w-full"
                  >
                    <option value="">Select Player/Partnership 1</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nickname ?? user.name}
                      </option>
                    ))}
                    {partnerships.map((partnership) => (
                      <option key={partnership.id} value={partnership.id}>
                        {partnership.nickname ?? 
                         `${partnership.player1.nickname ?? partnership.player1.name} & 
                          ${partnership.player2.nickname ?? partnership.player2.name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Player/Partnership 2</span>
                  </label>
                  <select
                    name="player2Id"
                    required
                    className="select select-bordered w-full"
                  >
                    <option value="">Select Player/Partnership 2</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nickname ?? user.name}
                      </option>
                    ))}
                    {partnerships.map((partnership) => (
                      <option key={partnership.id} value={partnership.id}>
                        {partnership.nickname ?? 
                         `${partnership.player1.nickname ?? partnership.player1.name} & 
                          ${partnership.player2.nickname ?? partnership.player2.name}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Tournament Name</span>
                  </label>
                  <input
                    type="text"
                    name="tournamentName"
                    placeholder="Optional"
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Event Name</span>
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    placeholder="Optional"
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Optional"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>

              <div className="form-control mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
