/**
 * Adds seed data to your db
 *
 * @link https://www.prisma.io/docs/guides/database/seed-database
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { name: 'testuser1' },
    update: {},
    create: {
      name: 'testuser1',
      nickname: 'Test User 1',
      password: bcrypt.hashSync('password123', 10),
      image: 'https://example.com/avatar1.jpg',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { name: 'testuser2' },
    update: {},
    create: {
      name: 'testuser2',
      nickname: 'Test User 2',
      password: bcrypt.hashSync('password123', 10),
      image: 'https://example.com/avatar2.jpg',
    },
  });

  // Create single ranks
  await prisma.singleRank.upsert({
    where: { id: `${user1.id}_single` },
    update: { score: 1500 },
    create: {
      id: `${user1.id}_single`,
      userId: user1.id,
      score: 1500,
    },
  });

  await prisma.singleRank.upsert({
    where: { id: `${user2.id}_single` },
    update: { score: 1400 },
    create: {
      id: `${user2.id}_single`,
      userId: user2.id,
      score: 1400,
    },
  });

  // Create player stats
  await prisma.playerStats.upsert({
    where: { playerId: user1.id },
    update: {
      totalMatches: 10,
      wonMatches: 7,
      lostMatches: 3,
      winPercentage: 70,
    },
    create: {
      playerId: user1.id,
      totalMatches: 10,
      wonMatches: 7,
      lostMatches: 3,
      winPercentage: 70,
    },
  });

  await prisma.playerStats.upsert({
    where: { playerId: user2.id },
    update: {
      totalMatches: 8,
      wonMatches: 3,
      lostMatches: 5,
      winPercentage: 37,
    },
    create: {
      playerId: user2.id,
      totalMatches: 8,
      wonMatches: 3,
      lostMatches: 5,
      winPercentage: 37,
    },
  });

  // Create a partnership
  const partnership = await prisma.partnership.upsert({
    where: {
      player1Id_player2Id: {
        player1Id: user1.id,
        player2Id: user2.id,
      }
    },
    update: {},
    create: {
      player1Id: user1.id,
      player2Id: user2.id,
    },
  });

  // Create double rank for partnership
  await prisma.doubleRank.upsert({
    where: { id: `${partnership.id}_double` },
    update: { score: 1450 },
    create: {
      id: `${partnership.id}_double`,
      partnershipId: partnership.id,
      score: 1450,
    },
  });

  // Create a singles match
  const match = await prisma.match.create({
    data: {
      type: 'SINGLES',
      player1Id: user1.id,
      player2Id: user2.id,
      closed: true,
      rounds: {
        create: [
          {
            roundNumber: 1,
            player1Score: 21,
            player2Score: 19,
          },
          {
            roundNumber: 2,
            player1Score: 21,
            player2Score: 15,
          }
        ]
      }
    }
  });

  console.log('Seed data created:', {
    users: [user1, user2],
    partnership,
    match,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
