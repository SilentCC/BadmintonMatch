/*
  Warnings:

  - You are about to drop the column `partnerId` on the `DoubleRank` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `DoubleRank` table. All the data in the column will be lost.
  - Added the required column `partnershipId` to the `DoubleRank` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DoubleRank" DROP CONSTRAINT "DoubleRank_partnerId_fkey";

-- DropForeignKey
ALTER TABLE "DoubleRank" DROP CONSTRAINT "DoubleRank_playerId_fkey";

-- DropIndex
DROP INDEX "DoubleRank_playerId_partnerId_key";

-- AlterTable
ALTER TABLE "DoubleRank" DROP COLUMN "partnerId",
DROP COLUMN "playerId",
ADD COLUMN     "partnershipId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_player1Id_player2Id_key" ON "Partnership"("player1Id", "player2Id");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubleRank" ADD CONSTRAINT "DoubleRank_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
