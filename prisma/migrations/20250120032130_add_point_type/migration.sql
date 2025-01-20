-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('POINTS', 'EATING');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "pointType" "PointType" NOT NULL DEFAULT 'EATING';
