'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Match, User, Partnership } from "@prisma/client";
import MakeMatchView from './MakeMatchView'

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
}

interface DoubleMatch {
  partnership1Player1: User;
  partnership1Player2: User;
  partnership2Player1: User;
  partnership2Player2: User;
}

interface MatchResultsProps {
  matches: DoubleMatch[];
}

export default function MatchResults({ matches }: MatchResultsProps) {
  if (matches.length === 0) return null

  const convertToMatchWithRelations = (match: DoubleMatch): MatchWithRelations => ({
    id: 'preview',
    type: 'DOUBLES',
    player1Id: null,
    player2Id: null,
    partnership1Id: 'preview-p1',
    partnership2Id: 'preview-p2',
    tournamentName: null,
    eventName: null,
    matchDate: new Date(),
    location: null,
    closed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    partnership1: {
      id: 'preview-p1',
      player1Id: match.partnership1Player1.id,
      player2Id: match.partnership1Player2.id,
      nickname: `${match.partnership1Player1.name} & ${match.partnership1Player2.name}`,
      player1: match.partnership1Player1,
      player2: match.partnership1Player2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    partnership2: {
      id: 'preview-p2',
      player1Id: match.partnership2Player1.id,
      player2Id: match.partnership2Player2.id,
      nickname: `${match.partnership2Player1.name} & ${match.partnership2Player2.name}`,
      player1: match.partnership2Player1,
      player2: match.partnership2Player2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  return (
    <div className="space-y-4">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold"
      >
        Generated Matches
      </motion.h2>

      <motion.div className="grid gap-4" layout>
        <AnimatePresence>
          {matches.map((match, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <MakeMatchView match={convertToMatchWithRelations(match)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}