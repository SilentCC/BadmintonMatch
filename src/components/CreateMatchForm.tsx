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
    let partnership1Id = formData.get('partnership1Id') as string | null;
    let partnership2Id = formData.get('partnership2Id') as string | null;
    const tournamentName = formData.get('tournamentName') as string | null;
    const eventName = formData.get('eventName') as string | null;
    const location = formData.get('location') as string | null;

    console.log(matchType)

    // Validate partnership creation for doubles
    if (matchType === 'DOUBLES') {
      // Check for new partnership 1 creation first
      const newPartnership1Player1 = formData.get('newPartnership1Player1') as string | null;
      const newPartnership1Player2 = formData.get('newPartnership1Player2') as string | null;
      const newPartnership1Nickname = formData.get('newPartnership1Nickname') as string | null;

      console.log("fuck!")

      if ((newPartnership1Player1 && newPartnership1Player2) ?? partnership1Id) {
        if (newPartnership1Player1 && newPartnership1Player2 && 
            newPartnership1Player1 !== '' && 
            newPartnership1Player2 !== '') {
          let createdPartnership1Error: string | null = null;
          try {
            const createdPartnership1 = await prisma.partnership.create({
              data: {
                player1Id: newPartnership1Player1,
                player2Id: newPartnership1Player2,
                nickname: newPartnership1Nickname ?? null,
              }
            });

            await prisma.doubleRank.create({
              data: {
                partnershipId: createdPartnership1.id,
                score: 0
              }
            });
            partnership1Id = createdPartnership1.id;
          } catch (error) {
            console.log(error);
            console.error('Failed to create partnership 1:', error);
            createdPartnership1Error = error instanceof Error ? error.message : 'Failed to create partnership 1';
          } finally {
            if (createdPartnership1Error) {
              redirect(`/matches/create?error=${encodeURIComponent(createdPartnership1Error)}`);
            }
          }
        }
      } else {
        redirect(`/matches/create?error=${encodeURIComponent('Partnership 1 must be selected or created')}`);
      }

      // Check for new partnership 2 creation first
      const newPartnership2Player1 = formData.get('newPartnership2Player1') as string | null;
      const newPartnership2Player2 = formData.get('newPartnership2Player2') as string | null;
      const newPartnership2Nickname = formData.get('newPartnership2Nickname') as string | null;

      if ((newPartnership2Player1 && newPartnership2Player2) ?? partnership2Id) {
        if (newPartnership2Player1 && newPartnership2Player2 && 
            newPartnership2Player1 !== '' && 
            newPartnership2Player2 !== '') {
          let createdPartnership2Error: string | null = null;
          try {
            const createdPartnership2 = await prisma.partnership.create({
              data: {
                player1Id: newPartnership2Player1,
                player2Id: newPartnership2Player2,
                nickname: newPartnership2Nickname ?? null,
              }
            });

            await prisma.doubleRank.create({
              data: {
                partnershipId: createdPartnership2.id,
                score: 0
              }
            });
            partnership2Id = createdPartnership2.id;
          } catch (error) {
            console.log(error);
            console.error('Failed to create partnership 2:', error);
            createdPartnership2Error = error instanceof Error ? error.message : 'Failed to create partnership 2';
          } finally {
            if (createdPartnership2Error) {
              redirect(`/matches/create?error=${encodeURIComponent(createdPartnership2Error)}`);
            }
          }
        }
      } else {
        redirect(`/matches/create?error=${encodeURIComponent('Partnership 2 must be selected or created')}`);
      }
    } else {
      // For singles, ensure players are selected
      if (!player1Id || !player2Id) {
        redirect(`/matches/create?error=${encodeURIComponent('Both players must be selected')}`);
      }
    }

    let errorMessage: string | null = null;
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
    } catch (error) {
      console.log(error);
      console.error('Failed to create match:', error);
      errorMessage = 'Failed to create match';
    } finally {
      if (errorMessage) {
        redirect(`/matches/create?error=${encodeURIComponent(errorMessage)}`);
      } else {
        redirect('/matches');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Create New Match</h2>
            <form id="createMatchForm" action={handleSubmit} className="space-y-4">
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

              <div id="matchTypeSection">
                <div id="singlesSection" className="grid grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Player 1</span>
                    </label>
                    <select
                      name="player1Id"
                      className="select select-bordered w-full"
                    >
                      <option value="">Select Player 1</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nickname ?? user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text">Player 2</span>
                    </label>
                    <select
                      name="player2Id"
                      className="select select-bordered w-full"
                    >
                      <option value="">Select Player 2</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.nickname ?? user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div id="doublesSection" className="hidden space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">Existing Partnership 1</span>
                      </label>
                      <select
                        name="partnership1Id"
                        className="select select-bordered w-full partnership-select"
                        data-new-player1="newPartnership1Player1"
                        data-new-player2="newPartnership1Player2"
                      >
                        <option value="">Select Existing Partnership</option>
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
                        <span className="label-text">Or Create New Partnership 1</span>
                      </label>
                      <input
                        type="text"
                        name="newPartnership1Nickname"
                        placeholder="Partnership Nickname (Optional)"
                        className="input input-bordered w-full mb-2"
                      />
                      <select
                        name="newPartnership1Player1"
                        className="select select-bordered w-full mb-2 new-partnership-player"
                      >
                        <option value="">Select Player 1</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nickname ?? user.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="newPartnership1Player2"
                        className="select select-bordered w-full new-partnership-player"
                      >
                        <option value="">Select Player 2</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nickname ?? user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text">Existing Partnership 2</span>
                      </label>
                      <select
                        name="partnership2Id"
                        className="select select-bordered w-full partnership-select"
                        data-new-player1="newPartnership2Player1"
                        data-new-player2="newPartnership2Player2"
                      >
                        <option value="">Select Existing Partnership</option>
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
                        <span className="label-text">Or Create New Partnership 2</span>
                      </label>
                      <input
                        type="text"
                        name="newPartnership2Nickname"
                        placeholder="Partnership Nickname (Optional)"
                        className="input input-bordered w-full mb-2"
                      />
                      <select
                        name="newPartnership2Player1"
                        className="select select-bordered w-full mb-2 new-partnership-player"
                      >
                        <option value="">Select Player 1</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nickname ?? user.name}
                          </option>
                        ))}
                      </select>
                      <select
                        name="newPartnership2Player2"
                        className="select select-bordered w-full new-partnership-player"
                      >
                        <option value="">Select Player 2</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.nickname ?? user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
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

      <script dangerouslySetInnerHTML={{
        __html: `
          document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('createMatchForm');
            const matchTypeRadios = form.querySelectorAll('input[name="matchType"]');
            const singlesSection = document.getElementById('singlesSection');
            const doublesSection = document.getElementById('doublesSection');

            // Default to singles section
            singlesSection.classList.remove('hidden');
            doublesSection.classList.add('hidden');

            // Toggle sections based on match type
            matchTypeRadios.forEach(radio => {
              radio.addEventListener('change', function() {
                if (this.value === 'SINGLES') {
                  singlesSection.classList.remove('hidden');
                  doublesSection.classList.add('hidden');
                } else {
                  singlesSection.classList.add('hidden');
                  doublesSection.classList.remove('hidden');
                }
              });
            });

            // Basic client-side validation before submission
            form.addEventListener('submit', function(event) {
              const matchType = form.querySelector('input[name="matchType"]:checked')?.value;
              
              if (matchType === 'SINGLES') {
                const player1 = form.querySelector('select[name="player1Id"]');
                const player2 = form.querySelector('select[name="player2Id"]');
                
                if (player1.value === '' || player2.value === '') {
                  event.preventDefault();
                  alert('Please select both players for a singles match');
                  return;
                }
              } else if (matchType === 'DOUBLES') {
                const partnership1Select = form.querySelector('select[name="partnership1Id"]');
                const partnership2Select = form.querySelector('select[name="partnership2Id"]');
                const newPartnership1Player1 = form.querySelector('select[name="newPartnership1Player1"]');
                const newPartnership1Player2 = form.querySelector('select[name="newPartnership1Player2"]');
                const newPartnership2Player1 = form.querySelector('select[name="newPartnership2Player1"]');
                const newPartnership2Player2 = form.querySelector('select[name="newPartnership2Player2"]');

                // Check if either existing partnership or new partnership is created
                const isPartnership1Valid = 
                  partnership1Select.value !== '' || 
                  (newPartnership1Player1.value !== '' && newPartnership1Player2.value !== '');
                
                const isPartnership2Valid = 
                  partnership2Select.value !== '' || 
                  (newPartnership2Player1.value !== '' && newPartnership2Player2.value !== '');

                if (!isPartnership1Valid || !isPartnership2Valid) {
                  event.preventDefault();
                  alert('Please select or create partnerships for both teams');
                  return;
                }
              }
            });
          });
        `
      }} />
    </div>
  );
}