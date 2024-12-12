-- CreateTable
CREATE TABLE "SingleRank" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SingleRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubleRank" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "playerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubleRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SingleRank_score_idx" ON "SingleRank"("score");

-- CreateIndex
CREATE INDEX "DoubleRank_score_idx" ON "DoubleRank"("score");

-- CreateIndex
CREATE UNIQUE INDEX "DoubleRank_playerId_partnerId_key" ON "DoubleRank"("playerId", "partnerId");

-- AddForeignKey
ALTER TABLE "SingleRank" ADD CONSTRAINT "SingleRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubleRank" ADD CONSTRAINT "DoubleRank_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubleRank" ADD CONSTRAINT "DoubleRank_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
