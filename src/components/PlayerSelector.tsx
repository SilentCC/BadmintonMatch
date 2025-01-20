'use client'

import { useState, useRef, useEffect } from 'react'
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const defaultAvatar = 'https://cs110032000d3024da4.blob.core.windows.net/avatars/badmintonplayer.png'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <div className="card bg-gradient-to-br from-sky-50 to-white p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-4 text-sky-600">Players Pool</h3>

      <div className="form-control gap-2">
        <div className="relative w-full" ref={dropdownRef}>
          <button
            type="button"
            className="btn bg-sky-100 hover:bg-sky-200 border-sky-200 w-full text-left justify-start gap-2 hover:scale-[1.01] transition-transform text-sky-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
            </svg>
            Select a player
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-box shadow-xl z-[100] max-h-[300px] overflow-auto border border-sky-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3">
                {availablePlayers
                  .filter(player => !selectedPlayers.some(sp => sp.id === player.id))
                  .map(player => (
                    <button
                      key={player.id}
                      onClick={() => addPlayer(player)}
                      className="flex items-center gap-2 p-2 hover:bg-sky-50 transition-all rounded-lg hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <div className="avatar">
                        <div className="w-8 h-8 rounded-full ring-2 ring-sky-100 group-hover:ring-sky-200 transition-all">
                          <img
                            src={player.image ?? defaultAvatar}
                            alt={player.name ?? ''}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <span className="truncate font-medium group-hover:text-sky-600">{player.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-sm font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="divider text-sky-600 font-semibold">
        Selected Players ({selectedPlayers.length})
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
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
              className="card bg-gradient-to-br from-sky-50 to-sky-100/50 shadow-md hover:shadow-lg transition-all"
            >
              <div className="card-body p-3 flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="avatar">
                    <div className="w-8 h-8 rounded-full ring-2 ring-sky-200">
                      <img
                        src={player.image ?? defaultAvatar}
                        alt={player.name ?? ''}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <span className="font-medium truncate text-sky-700">{player.name}</span>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="btn btn-ghost btn-xs btn-circle shrink-0 hover:bg-red-50 hover:text-red-500 transition-colors"
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