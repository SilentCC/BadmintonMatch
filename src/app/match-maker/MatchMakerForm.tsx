'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import PlayerSelector from '~/components/PlayerSelector'
import MatchResults from '~/components/MakeMatchResults'
import { useSession } from 'next-auth/react'

interface MatchMakerFormProps {
  users: User[]
  generateMatches: (players: User[]) => Promise<any>
  saveMatches: (matches: any[]) => Promise<any>
}

export default function MatchMakerForm({ users, generateMatches, saveMatches }: MatchMakerFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [selectedPlayers, setSelectedPlayers] = useState<User[]>([])
  const [matches, setMatches] = useState<any[]>([])

  const isAdmin = session?.user?.name === 'yongkang'

  const handleSubmit = async () => {
    try {
      const generatedMatches = await generateMatches(selectedPlayers)
      setMatches(generatedMatches)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const handleSave = async () => {
    try {
      const result = await saveMatches(matches)
      if (result.success) {
        alert('Matches saved successfully!')
        router.push('/matches')
      } else {
        alert(result.error || 'Failed to save matches')
      }
    } catch (error) {
      alert((error as Error).message)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <PlayerSelector
          selectedPlayers={selectedPlayers}
          onPlayersChange={setSelectedPlayers}
          availablePlayers={users}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={selectedPlayers.length < 4}
          className="btn btn-primary mb-8"
        >
          Generate Matches
        </button>
        {matches.length > 0 && isAdmin && (
          <button
            onClick={handleSave}
            className="btn btn-secondary mb-8"
          >
            Save Changes
          </button>
        )}
      </div>

      <MatchResults matches={matches} />
    </div>
  )
}