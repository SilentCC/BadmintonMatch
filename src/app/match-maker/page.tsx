import { Suspense } from 'react'
import { prisma } from '~/server/prisma'
import { generateBalancedDoubleMatches } from '~/server/matchActions'
import { revalidatePath } from 'next/cache'
import { auth } from '~/auth'
import { redirect } from 'next/navigation'
import MatchMakerForm from './MatchMakerForm'
import { User } from '@prisma/client'
import { SessionProvider } from 'next-auth/react'

async function generateMatches(players: User[]) {
  'use server'

  if (players.length < 4) {
    throw new Error('Need at least 4 players')
  }

  const generatedMatches = await generateBalancedDoubleMatches(players)

  return generatedMatches
}

async function saveMatches(matches: any[]) {
  'use server'

  try {
    for (const match of matches) {
      // Check if partnerships exist
      let partnership1 = await prisma.partnership.findFirst({
        where: {
          AND: [
            {
              OR: [
                { player1Id: match.partnership1Player1.id, player2Id: match.partnership1Player2.id },
                { player1Id: match.partnership1Player2.id, player2Id: match.partnership1Player1.id }
              ]
            }
          ]
        }
      });

      let partnership2 = await prisma.partnership.findFirst({
        where: {
          AND: [
            {
              OR: [
                { player1Id: match.partnership2Player1.id, player2Id: match.partnership2Player2.id },
                { player1Id: match.partnership2Player2.id, player2Id: match.partnership2Player1.id }
              ]
            }
          ]
        }
      });

      // Create partnerships if they don't exist
      if (!partnership1) {
        partnership1 = await prisma.partnership.create({
          data: {
            player1: { connect: { id: match.partnership1Player1.id } },
            player2: { connect: { id: match.partnership1Player2.id } },
          }
        });
      }

      if (!partnership2) {
        partnership2 = await prisma.partnership.create({
          data: {
            player1: { connect: { id: match.partnership2Player1.id } },
            player2: { connect: { id: match.partnership2Player2.id } },
          }
        });
      }

      await prisma.match.create({
        data: {
          type: 'DOUBLES',
          pointType: 'POINTS',
          player1Id: null,
          player2Id: null,
          partnership1Id: partnership1.id,
          partnership2Id: partnership2.id,
          matchDate: new Date(),
        }
      });
    }
    revalidatePath('/matches')
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export default async function MatchMakerPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const users = await prisma.user.findMany({
    orderBy: {
      name: 'asc'
    }
  });

  return (
    <SessionProvider session={session}>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Match Maker</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <MatchMakerForm
            users={users}
            generateMatches={generateMatches}
            saveMatches={saveMatches}
          />
        </Suspense>
      </div>
    </SessionProvider>
  )
}