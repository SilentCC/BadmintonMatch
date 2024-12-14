import { redirect } from 'next/navigation';
import { auth } from '~/auth';
import ProfileForm from './ProfileForm';

import { prisma } from '~/server/prisma';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const singlePlayerRank = await prisma.singleRank.findFirst({
    where: { userId: session.user.id },
    select: { rank: true, score: true }
  });

  const doublePlayerRank = await prisma.doubleRank.findFirst({
    where: {
      OR: [
        { partnership: { player1Id: session.user.id } },
        { partnership: { player2Id: session.user.id } }
      ]
    },
    select: { rank: true, score: true }
  });

  return (
    <ProfileForm 
      session={session} 
      singlePlayerRanking={singlePlayerRank ? { rank: singlePlayerRank.rank, points: singlePlayerRank.score } : { rank: 0, points: 0 }}
      doublePlayerRanking={doublePlayerRank ? { rank: doublePlayerRank.rank, points: doublePlayerRank.score } : { rank: 0, points: 0 }}
    />
  );
}