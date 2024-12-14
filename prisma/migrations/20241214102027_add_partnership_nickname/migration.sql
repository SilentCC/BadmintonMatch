/*
  Warnings:

  - A unique constraint covering the columns `[nickname]` on the table `Partnership` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Partnership" ADD COLUMN     "nickname" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_nickname_key" ON "Partnership"("nickname");
