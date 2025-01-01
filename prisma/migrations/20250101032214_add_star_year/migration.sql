-- CreateTable
CREATE TABLE "YearStar" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YearStar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YearStar_year_idx" ON "YearStar"("year");

-- CreateIndex
CREATE UNIQUE INDEX "YearStar_year_rank_key" ON "YearStar"("year", "rank");

-- AddForeignKey
ALTER TABLE "YearStar" ADD CONSTRAINT "YearStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
