'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@prisma/client'

interface PlayerSelectorProps {
  selectedPlayers: User[]
  onPlayersChange: (players: User[]) => void
  availablePlayers: User[]
}

export default function PlayerSelector({ selectedPlayers, onPlayersChange, availablePlayers }: PlayerSelectorProps) {
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const defaultAvatar = 'https://cs110032000d3024da4.blob.core.windows.net/avatars/badmintonplayer.png'

  const addPlayer = (player: User) => {
    if (selectedPlayers.some(p => p.id === player.id)) {
      setError('Player already selected')
      return
    }

    onPlayersChange([...selectedPlayers, player])
    setError('')
    setIsOpen(false)
  }

  const removePlayer = (playerId: string) => {
    onPlayersChange(selectedPlayers.filter(p => p.id !== playerId))
  }

  return (
    <div className="card bg-base-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Players Pool</h3>

      <div className="form-control gap-2">
        <div className="dropdown dropdown-bottom w-full">
          <button
            className="btn btn-outline w-full text-left justify-start"
            onClick={() => setIsOpen(!isOpen)}
          >
            Select a player
          </button>
          {isOpen && (
            <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-auto z-50 mt-1">
              {availablePlayers
                .filter(player => !selectedPlayers.some(sp => sp.id === player.id))
                .map(player => (
                  <li key={player.id}>
                    <button
                      onClick={() => addPlayer(player)}
                      className="flex items-center gap-2 p-2"
                    >
                      <img
                        src={player.image ?? defaultAvatar}
                        alt={player.name ?? ''}
                        className="w-8 h-8 rounded-full"
                      />
                      <span>{player.name}</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-error text-sm"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="divider">Selected Players ({selectedPlayers.length})</div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
        layout
      >
        <AnimatePresence>
          {selectedPlayers.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              className="card bg-base-100 shadow-sm"
            >
              <div className="card-body p-3 flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={player.image ?? defaultAvatar}
                    alt={player.name ?? ''}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <span className="font-medium truncate">{player.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="btn btn-ghost btn-xs btn-circle shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}